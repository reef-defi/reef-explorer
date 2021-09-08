// @ts-check
let solc = require("solc");
const pino = require('pino');
const logger = pino();
const { Client } = require('pg');
require('dotenv').config();
const config = require('./verificator.config');
const { options } = require('@reef-defi/api');
const { Provider } = require('@reef-defi/evm-provider');
const { WsProvider } = require('@polkadot/api');
const { ethers } = require('ethers');
const loggerOptions = {};

const getClient = async () => {
  const client = new Client(config.postgresConnParams);
  await client.connect();
  return client;
};

const parametrizedDbQuery = async (client, query, data) => {
  try {
    return await client.query(query, data);
  } catch (error) {
    logger.error(loggerOptions, `Db error: ${error}`);
    return false;
  }
};

const getPendingRequests = async (client) => {
  try {
    const query = `
      SELECT
        id,
        contract_id,
        source,
        filename,
        compiler_version,
        arguments,
        optimization,
        runs,
        target,
        license
      FROM contract_verification_request
      WHERE status = 'PENDING'
      ;`;
    const res = await client.query(query);
    return res.rows || [];
  } catch (error) {
    logger.error(loggerOptions, `Db error: ${error}`);
    return [];
  }
};

const updateRequestStatus = async (client, id, status) => {
  logger.info({ request: id }, `Updating request status to '${status}'`);
  await parametrizedDbQuery(
    client,
    `UPDATE contract_verification_request SET status = $1 WHERE id = $2;`,
    [status, id]
  );
};

const updateRequestError = async (client, id, errorType, errorMessage) => {
  logger.info({ request: id }, `Updating error type to '${errorType}'`);
  await parametrizedDbQuery(
    client,
    `UPDATE contract_verification_request SET error_type = $1, error_message = $2 WHERE id = $3;`,
    [errorType, errorMessage, id]
  );
};

const getOnChainContractBytecode = async (client, contract_id) => {
  const query = `SELECT bytecode FROM contract WHERE contract_id = $1;`;
  const data = [contract_id];
  const res = await parametrizedDbQuery(client, query, data);
  if (res) {
    if (res.rows.length > 0) {
      return res.rows[0].bytecode;
    }
  }
  return '';
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

const loadCompiler = async (version) => (
  new Promise((resolve, reject) => {
    solc.loadRemoteVersion(version, (err, solcSnapshot) => {
      err ? reject(err) : resolve(solcSnapshot);
    });
  })
);

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

const checkIfContractMatch = (requestBytecode, existingBytecode) => {
  return requestBytecode === existingBytecode;
};

const prepareSolcContracts = (contracts, optimization, runs, evmVersion) => ({
  language: 'Solidity',
  sources: {...contracts},
  settings: {
    optimizer: {
      enabled: optimization,
      runs
    },
    evmVersion,
    outputSelection: {
      '*': {
        '*': ['*']
      }
    }
  }
});

const getContractArtifacts = async (compiler, filename, existingBytecode, inputs) => {
  try {
    const contracts = JSON.parse(compiler.compile(JSON.stringify(inputs)));

    // debug
    logger.info(loggerOptions, `compiler output (first 255 chars): ${JSON.stringify(contracts).substr(0,255)}...`);

    // filename excluding the extension should be equal to contract name in source code
    const contractName = filename.split('.')[0];
    const contractAbi = contracts.contracts[filename][contractName].abi;
    const requestBytecode = preprocessBytecode(contracts.contracts[filename][contractName].evm.bytecode.object);
    const isVerified = checkIfContractMatch(requestBytecode, existingBytecode);
    const result = {
      isVerified,
      contractName,
      contractAbi,
      requestBytecode,
    };
    return result;
  } catch (error) {
    logger.info(loggerOptions, `compiler error: ${JSON.stringify(error)}`);
    return {
      error: true,
      message: JSON.stringify(error)
    };
  }
};

const stringMatch = (a, b) => {
  let equivalency = 0;
  let minLength = (a.length > b.length) ? b.length : a.length;    
  let maxLength = (a.length < b.length) ? b.length : a.length;    
  for (let i = 0; i < minLength; i++) {
    if (a[i] == b[i]) {
      equivalency++;
    }
  }
  let weight = equivalency / maxLength;
  return (weight * 100);
}

const processVerificationRequest = async (request, client, provider) => {
  try {
    const {
      id,
      contract_id,
      source,
      filename,
      compiler_version,
      // @ts-ignore
      arguments,
      optimization,
      runs,
      target,
      license
    } = request
    logger.info({ request: id }, `Processing contract verification request for contract ${contract_id}`);
    const onChainContractBytecode = await getOnChainContractBytecode(client, contract_id);

    // debug
    // logger.info({ request: id }, `onChainContractBytecode: ${onChainContractBytecode}`);

    const existing = preprocessBytecode(onChainContractBytecode);
    const compiler = await loadCompiler(compiler_version);
    const contracts = [];
    contracts[filename] = { content: source };

    // debug
    // logger.info({ request: id }, `filename: ${filename}`);
    // logger.info({ request: id }, `compiler_version: ${compiler_version}`);
    // logger.info({ request: id }, `arguments: ${arguments}`);
    // logger.info({ request: id }, `optimization: ${optimization}`);
    // logger.info({ request: id }, `runs: ${runs}`);
    // logger.info({ request: id }, `target: ${target}`);
    // logger.info({ request: id }, `license: ${license}`);

    const artifacts = await getContractArtifacts(
      compiler,
      filename,
      existing,
      prepareSolcContracts(contracts, optimization, runs, target)
    );

    if (artifacts?.error) {
      logger.info({ request: id }, `Contract is not verified, compilation error: ${artifacts?.message}`);
      await updateRequestStatus(client, id, 'ERROR');
      await updateRequestError(client, id, 'COMPILATION_ERROR', artifacts.error);
      return;
    }
    const { isVerified, contractName, contractAbi, requestBytecode } = artifacts;

    // debug
    // logger.info({ request: id }, `existing: ${existing}`);
    // logger.info({ request: id }, `request: ${requestBytecode}`);

    if (isVerified) {
      logger.info({ request: id }, `Contract ${contract_id} is verified!`);
      await updateRequestStatus(client, id, 'VERIFIED');

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
          typeof contract['name()'] === 'function'
          && typeof contract['symbol()'] === 'function'
          && typeof contract['decimals()'] === 'function'
          && typeof contract['totalSupply()'] === 'function'
          && typeof contract['balanceOf(address _owner)'] === 'function'
          && typeof contract['transfer(address _to, uint256 _value)'] === 'function'
          && typeof contract['transferFrom(address _from, address _to, uint256 _value)'] === 'function'
          && typeof contract['approve(address _spender, uint256 _value)'] === 'function'
          && typeof contract['allowance(address _owner, address _spender)'] === 'function'
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
          compiler_version,
          arguments,
          optimization,
          runs,
          target,
          JSON.stringify(contractAbi),
          license,
          isErc20,
          tokenName,
          tokenSymbol,
          tokenDecimals,
          tokenTotalSupply,
          matchedContractId
        ];
        await parametrizedDbQuery(client, query, data);
      }

    } else {
      const bytecodes = JSON.stringify({
        request: requestBytecode,
        onchain: existing,
      });

      const matchPercentaje = stringMatch(requestBytecode, existing)
      await updateRequestStatus(client, id, 'ERROR');
      await updateRequestError(client, id, 'BYTECODE_MISMATCH', bytecodes);
      logger.info({ request: id }, `Contract is not verified, bytecode mismatch (${matchPercentaje}%)`);
    }
    
    // TODO: delete request older than 1 week

  } catch (error) {
    logger.error(loggerOptions, `Error: ${error}`);
  }
};

const main = async () => {
  logger.info(loggerOptions, `Starting contract verificator`);
  logger.info(loggerOptions, `Connecting to db`);
  const client = await getClient();
  logger.info(loggerOptions, `Connecting to chain rpc ${config.nodeWs}`);
  const provider = new Provider(
    options({
      provider: new WsProvider(config.nodeWs),
    })
  )
  await provider.api.isReady
  logger.info(loggerOptions, `Processing pending requests`);
  const pendingRequests = await getPendingRequests(client);
  for (const request of pendingRequests) {
    await processVerificationRequest(request, client, provider);
  }
  logger.info(loggerOptions, `Disconnecting from db`);
  await client.end();
  logger.info(loggerOptions, `Disconnecting from chain rpc`);
  provider.api.disconnect();
  logger.info(loggerOptions, `Contract verificator finished, sleeping ${config.pollingTime / 1000}s`);
  setTimeout(
    () => main(),
    config.pollingTime,
  );
};

main().catch((error) => {
  logger.error(loggerOptions, `Main error: ${error}`);
  logger.error(loggerOptions, `Contract verificator stopped!`);
});
