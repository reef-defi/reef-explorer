const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const crypto = require('crypto');
const fetch = require('node-fetch');
const { Pool } = require('pg');
const axios = require('axios');
const { options } = require('@reef-defi/api');
const { Provider } = require('@reef-defi/evm-provider');
const { WsProvider } = require('@polkadot/api');
const { ethers } = require('ethers');
const config = require('./api.config');

// Connnect to db
const getPool = async () => {
  const pool = new Pool(config.postgresConnParams);
  await pool.connect();
  return pool;
}

const app = express();

// Enable file upload
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 1 * 1024 * 1024 * 1024 // 1MB max file(s) size
  },
}));

// Add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

const preprocessBytecode = (bytecode) => {
  let filteredBytecode = "";
  const start = bytecode.indexOf('6080604052');
  //
  // metadata separator (solc >= v0.6.0)
  //
  const ipfsMetadataEnd = bytecode.indexOf('a264697066735822');
  filteredBytecode = bytecode.slice(start, ipfsMetadataEnd);

  //
  // metadata separator for 0.5.16
  //
  const bzzr1MetadataEnd = filteredBytecode.indexOf('a265627a7a72315820');
  filteredBytecode = filteredBytecode.slice(0, bzzr1MetadataEnd);

  return filteredBytecode;
};

// get not verified contracts with 100% matching bytecde (excluding metadata)
const getOnChainContractsByBytecode = async(client, bytecode) => {
  const query = `SELECT contract_id FROM contract WHERE bytecode LIKE $1 AND NOT verified;`;
  const preprocessedBytecode = preprocessBytecode(bytecode);
  const data = [`0x${preprocessedBytecode}%`];
  const res = await parametrizedDbQuery(client, query, data);
  if (res) {
    if (res.rows.length > 0) {
      return res.rows.map(({ contract_id }) => contract_id);
    }
  }
  return []
};

app.post('/api/verificator/request', async (req, res) => {
  try {
    if(!req.files || !req.body.token || !req.body.address || !req.body.compilerVersion || !req.body.optimization || !req.body.optimization || !req.body.runs || !req.body.target || !req.body.license) {
      res.send({
        status: false,
        message: 'Input error'
      });
    } else {
      // console.log(req);
      const token = req.body.token;
      const response = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${config.recaptchaSecret}&response=${token}`
      );
      const success = JSON.parse(await response.text()).success;
      if (success) {     
        const source = req.files.source;

        // check file extension, only .sol is allowed
        const fileName = source.name;
        const fileExtension = fileName.split('.').pop();
        if (fileExtension !== 'sol') {
          res.send({
            status: false,
            message: 'File error: only sol extension is allowed'
          });
        }

        // Insert contract_verification_request
        const sourceFileContent = source.data.toString('utf8');
        const id = crypto.randomBytes(20).toString('hex');
        const timestamp = Date.now();
        const pool = await getPool();
        const sql = `INSERT INTO contract_verification_request (
          id,
          contract_id,
          source,
          filename,
          compiler_version,
          optimization,
          runs,
          target,
          license,
          status,
          timestamp
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11
        );`;
        const data = [
          id,
          req.body.address,
          sourceFileContent.replace(/\x00/g,''),
          fileName,
          req.body.compilerVersion,
          req.body.optimization,
          req.body.runs,
          req.body.target,
          req.body.license,
          'PENDING',
          timestamp
        ];
        try {
          await pool.query(sql, data);
          res.send({
            status: true,
            message: 'Received verification request',
            data: {
              id,
              address: req.body.address,
              source: fileName,
              sourceMimetype: source.mimetype,
              sourceSize: source.size,
              compilerVersion: req.body.compilerVersion,
              optimization: req.body.optimization,
              runs: req.body.runs,
              target: req.body.target,
              license: req.body.license,
            }
          });
        } catch (error) {
          console.log('Database error:', error);
          res.send({
            status: false,
            message: 'Database error'
          });
        }
        await pool.end();
      } else {
        res.send({
          status: false,
          message: 'Token error'
        });
      }
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

//
// Endpoint: /api/verificator/deployed-bytecode-request
//
// Method: POST
//
// Params:
//
// address: contract address
// name: contract name (of the main contract)
// source: source code
// bytecode: deployed bytecode
// arguments: contract arguments (stringified json)
// abi: contract abi (stringified json)
// compilerVersion: i.e: v0.8.6+commit.11564f7e
// optimization: true | false
// runs: optimization runs
// target: default | homestead | tangerineWhistle | spuriousDragon | byzantium | constantinople | petersburg | istanbul
// license: "unlicense" | "MIT" | "GNU GPLv2" | "GNU GPLv3" | "GNU LGPLv2.1" | "GNU LGPLv3" | "BSD-2-Clause" | "BSD-3-Clause" | "MPL-2.0" | "OSL-3.0" | "Apache-2.0" | "GNU AGPLv3"
//

app.post('/api/verificator/deployed-bytecode-request', async (req, res) => {
  try {
    if(
      !req.body.address
      || !req.body.name
      || !req.body.source
      || !req.body.bytecode
      || !req.body.arguments
      || !req.body.abi
      || !req.body.compilerVersion
      || !req.body.optimization
      || !req.body.runs
      || !req.body.target
      || !req.body.license
    ) {
      res.send({
        status: false,
        message: 'Input error'
      });
    } else {
      let {
        address,
        name,
        source,
        bytecode,
        arguments,
        abi,
        compilerVersion,
        optimization,
        runs,
        target,
        license,
      } = req.body;
      const pool = await getPool();
      const query = "SELECT contract_id, verified, bytecode FROM contract WHERE contract_id = $1 AND bytecode LIKE $2;";
      const preprocessedRequestContractBytecode = preprocessBytecode(bytecode);
      const data = [address, `0x${preprocessedRequestBytecode}%`];
      const dbres = await pool.query(query, data);
      if (dbres) {
        if (dbres.rows.length === 1) {
          const onChainContractBytecode = dbres.rows[0].bytecode;
          const preprocessedOnChainContractBytecode = preprocessBytecode(onChainContractBytecode);
          if (dbres.rows[0].verified === true && preprocessedOnChainContractBytecode === preprocessedRequestContractBytecode) {
            res.send({
              status: false,
              message: 'Error, contract already verified'
            });
          } else {
            // connect to provider
            const provider = new Provider(
              options({
                provider: new WsProvider(config.nodeWs),
              })
            )
            await provider.api.isReady

            const isVerified = true;
            // find out default target
            if (target === 'default') {
              // v0.4.12
              const compilerVersionNumber = compilerVersion
                .split('-')[0]
                .split('+')[0]
                .substring(1)
              const compilerVersionNumber1 = parseInt(
                compilerVersionNumber.split('.')[0]
              )
              const compilerVersionNumber2 = parseInt(
                compilerVersionNumber.split('.')[1]
              )
              const compilerVersionNumber3 = parseInt(
                compilerVersionNumber.split('.')[2]
              )
              if (
                compilerVersionNumber1 === 0 &&
                compilerVersionNumber2 <= 5 &&
                compilerVersionNumber3 <= 4
              ) {
                target = 'byzantium'
              } else if (
                compilerVersionNumber1 === 0 &&
                compilerVersionNumber2 >= 5 &&
                compilerVersionNumber3 >= 5 &&
                compilerVersionNumber3 < 14
              ) {
                target = 'petersburg'
              } else {
                target = 'istanbul'
              }
            }
            // verify all not verified contracts with the same bytecode
            const matchedContracts = await getOnChainContractsByBytecode(client, onChainContractBytecode);
            for (const matchedContractId of matchedContracts) {
              //
              // check standard ERC20 interface: https://ethereum.org/en/developers/docs/standards/tokens/erc-20/ 
              //
              // function name() public view returns (string)
              // function symbol() public view returns (string)
              // function decimals() public view returns (uint8)
              // function totalSupply() public view returns (uint256)
              // function balanceOf(address _owner) public view returns (uint256 balance)
              // function transfer(address _to, uint256 _value) public returns (bool success)
              // function transferFrom(address _from, address _to, uint256 _value) public returns (bool success)
              // function approve(address _spender, uint256 _value) public returns (bool success)
              // function allowance(address _owner, address _spender) public view returns (uint256 remaining)
              //
              let isErc20 = false;
              let tokenName = null;
              let tokenSymbol = null;
              let tokenDecimals = null;
              let tokenTotalSupply = null;
              const contract = new ethers.Contract(
                matchedContractId,
                contractAbi,
                provider
              )

              if (
                typeof contract['name'] === 'function'
                && typeof contract['symbol'] === 'function'
                && typeof contract['decimals'] === 'function'
                && typeof contract['totalSupply'] === 'function'
                && typeof contract['balanceOf'] === 'function'
                && typeof contract['transfer'] === 'function'
                && typeof contract['transferFrom'] === 'function'
                && typeof contract['approve'] === 'function'
                && typeof contract['allowance'] === 'function'
              ) {
                isErc20 = true;
                tokenName = await contract['name()']();
                tokenSymbol = await contract['symbol()']();
                tokenDecimals = await contract['decimals()']();
                tokenTotalSupply = await contract['totalSupply()']();
                logger.info({ request: id }, `Contract ${matchedContractId} is an ERC20 token '${tokenName}' with total supply of ${tokenTotalSupply} ${tokenSymbol} (${tokenDecimals} decimals)`);
              }

              logger.info({ request: id }, `Updating matched contract ${matchedContractId} data in db`);
              const query = `UPDATE contract SET
                name = $1,
                verified = $2,
                source = $3,
                compiler_version = $4,
                arguments = $5,
                optimization = $6,
                runs = $7,
                target = $8,
                abi = $9,
                license = $10,
                is_erc20 = $11,
                token_name = $12,
                token_symbol = $13,
                token_decimals = $14,
                token_total_supply = $15
                WHERE contract_id = $16;
              `;
              const data = [
                contractName,
                isVerified,
                source,
                compilerVersion,
                arguments,
                optimization,
                runs,
                target,
                abi,
                license,
                isErc20,
                tokenName.toString(),
                tokenSymbol.toString(),
                tokenDecimals.toString(),
                tokenTotalSupply.toString(),
                matchedContractId
              ];
              await parametrizedDbQuery(client, query, data);
            }
            await provider.api.disconnect();
            await pool.query(query, data);
            res.send({
              status: true,
              message: 'Success, contract is verified'
            });
          }
        } else {
          res.send({
            status: false,
            message: 'Error, contract is not verified'
          });
        }
      } else {
        res.send({
          status: false,
          message: 'There was an error processing the request'
        });
      }
      await pool.end();
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/api/verificator/request-status', async (req, res) => {
  if(!req.params.id) {
    res.send({
      status: false,
      message: 'Input error'
    });
  } else {
    try {
      const requestId = req.params.id;
      const data = [
        requestId
      ];
      const query = `
        SELECT
          contract_id
          status
          error_type
          error_message
        FROM contract_verification_request
        WHERE id = $1
      ;`;
      const dbres = await pool.query(query, data);
      if (dbres.rows.length > 0) {
        if (res.rows[0].status) {
          const requestStatus = dbres.rows[0].status;
          const contractId = dbres.rows[0].contract_id;
          const errorType = dbres.rows[0].error_type;
          const errorMessage = dbres.rows[0].error_message;
          res.send({
            status: true,
            message: 'Request found',
            data: {
              id: requestId,
              address: contractId,
              status: requestStatus,
              error_type: errorType,
              error_message: errorMessage,
            }
          });
        } else {
          res.send({
            status: false,
            message: 'Request not found'
          });
        }
      } else {
        res.send({
          status: false,
          message: 'Request not found'
        });
      }
    } catch (error) {
      res.send({
        status: false,
        message: 'Error'
      });
    }
  }
});

app.get('/api/price/reef', async (req, res) => {
  const denom = 'reef-finance';
  await axios
    .get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${denom}&vs_currencies=usd&include_24hr_change=true`
    )
    .then((response) => {
      res.send({
        status: true,
        message: 'Success',
        data: {
          usd: response.data[denom].usd,
          usd_24h_change: response.data[denom].usd_24h_change,
        }
      });
    })
    .catch((error) => {
      res.send({
        status: false,
        message: 'Error'
      });
    })
});

app.get('/api/staking/rewards', async (req, res) => {
  try {
    const pool = await getPool();
    const query = `
      SELECT
        block_number,
        data,
        event_index,
        method,
        phase,
        section,
        timestamp
      FROM event
      WHERE section = 'staking' AND method = 'Reward'
    ;`;
    const dbres = await pool.query(query);
    if (dbres.rows.length > 0) {
      res.send({
        status: true,
        message: 'Request found',
        data: {
          rows: dbres.rows,
        }
      });
    } else {
      res.send({
        status: false,
        message: 'Request not found'
      });
    }
  } catch (error) {
    res.send({
      status: false,
      message: 'Error'
    });
  }
});

// Make uploads directory static
app.use(express.static('uploads'));

// Start app
app.listen(config.httpPort, () => 
  console.log(`Contract verificator API is listening on port ${config.httpPort}.`)
);
