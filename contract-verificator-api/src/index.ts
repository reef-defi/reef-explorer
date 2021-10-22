import express, {Response} from 'express';
import { compileSources } from './compiler';
import { connect, query } from './connector';
import { AppRequest, License, Target } from './types';

const app = express();
const port = 3000;

app.listen(port, () => {
  console.log(`Timezones by location application is running on port ${port}.`);
});





// Endpoint: /api/verificator/deployed-bytecode-request
//
// Method: POST
//
// Params:
//
// address: contract address
// name: contract name (of the main contract)
// source: source code
// bytecode: deployed (runtime) bytecode
// arguments: contract arguments (stringified json)
// abi: contract abi (stringified json)
// compilerVersion: i.e: v0.8.6+commit.11564f7e
// optimization: true | false
// runs: optimization runs
// target: default | homestead | tangerineWhistle | spuriousDragon | byzantium | constantinople | petersburg | istanbul
// license: "unlicense" | "MIT" | "GNU GPLv2" | "GNU GPLv3" | "GNU LGPLv2.1" | "GNU LGPLv3" | "BSD-2-Clause" | "BSD-3-Clause" | "MPL-2.0" | "OSL-3.0" | "Apache-2.0" | "GNU AGPLv3"

interface DeployedBytecodeReq {
  abi: string;
  args: string;
  runs: number;
  source: string;
  target: Target;
  address: string;
  bytecode: string;
  filename: string;
  license: License;
  optimization: boolean;
  compilerVersion: string;
}

interface ContracVerificationInsert {
  runs: number;
  source: string;
  status: string;
  target: Target;
  address: string;
  filename: string;
  license: License;
  optimization: boolean;
  compilerVersion: string;
}

const INSERT_CONTRACT_VERIFICATION_STATEMENT = `INSERT INTO contract_verification_request
(contract_id, source, filename, compiler_version, optimization, runs, target, license, status, timestamp)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`;

const contractVerificationInsert = async (contract: ContracVerificationInsert): Promise<void> => {
  const timestamp = Date.now();
  await query(
    INSERT_CONTRACT_VERIFICATION_STATEMENT,
    [
      contract.address,
      contract.source,
      contract.filename,
      contract.compilerVersion,
      contract.optimization,
      contract.runs,
      contract.target,
      contract.license,
      contract.status,
      timestamp,
    ]
  );
};

const FIND_VERIFIED_CONTRACT_STATEMENT = `SELECT * FROM contract_verification_req WHERE processed_bytecode = $1`;
const checkIfContractIsVerified = async (bytecode: string): Promise<boolean> => {
  const result = await query(FIND_VERIFIED_CONTRACT_STATEMENT, [bytecode]);
  return result.length > 0;
}

app.post('/api/verificator/deployed-bytecode', async (req: AppRequest<DeployedBytecodeReq>, res: Response) => {
  try {
    const bytecode = await compileSources(
      req.body.filename,
      req.body.filename,
      JSON.parse(req.body.source),
      req.body.compilerVersion,
      req.body.optimization,
      req.body.runs
    );
    const verified = await checkIfContractIsVerified(bytecode);
    const status = verified ? "VERIFIED" : "NOT VERIFIED"; // TODO
    await contractVerificationInsert({...req.body, status});
    res.send(status);
  } catch (err) {
    console.error(err);
    res.status(400).send(err.message);
  }
});

// app.post('/api/verificator/deployed-bytecode-request', async (req: any, res) => {
//   try {
//     if(
//       !req.body.address
//       || !req.body.name
//       || !req.body.source
//       || !req.body.bytecode
//       || !req.body.arguments
//       || !req.body.abi
//       || !req.body.compilerVersion
//       || !req.body.optimization
//       || !req.body.runs
//       || !req.body.target
//       || !req.body.license
//     ) {
//       res.send({
//         status: false,
//         message: 'Input error'
//       });
//     } else {
//       let {
//         address,
//         name,
//         source,
//         bytecode,
//         arguments:args,
//         abi,
//         compilerVersion,
//         optimization,
//         runs,
//         target,
//         license,
//       } = req.body;
//       const pool = await getPgPool();
//       const query = "SELECT contract_id, verified, bytecode FROM contract WHERE contract_id = $1 AND bytecode = $2;";
//       const data = [address, bytecode];
//       const dbres = await pool.query(query, data);
//       if (dbres) {
//         if (dbres.rows.length === 1) {
//           const onChainContractBytecode = dbres.rows[0].bytecode;
//           if (dbres.rows[0].verified === true) {
//             res.send({
//               status: false,
//               message: 'Error, contract already verified'
//             });
//           } else {
//             // connect to provider
//             const provider = new Provider({
//               provider: new WsProvider(config.nodeWs),
//             });
//             await provider.api.isReady;

//             const isVerified = true;
//             // find out default target
//             if (target === 'default') {
//               // v0.4.12
//               const compilerVersionNumber = compilerVersion
//                 .split('-')[0]
//                 .split('+')[0]
//                 .substring(1)
//               const compilerVersionNumber1 = parseInt(
//                 compilerVersionNumber.split('.')[0]
//               )
//               const compilerVersionNumber2 = parseInt(
//                 compilerVersionNumber.split('.')[1]
//               )
//               const compilerVersionNumber3 = parseInt(
//                 compilerVersionNumber.split('.')[2]
//               )
//               if (
//                 compilerVersionNumber1 === 0 &&
//                 compilerVersionNumber2 <= 5 &&
//                 compilerVersionNumber3 <= 4
//               ) {
//                 target = 'byzantium'
//               } else if (
//                 compilerVersionNumber1 === 0 &&
//                 compilerVersionNumber2 >= 5 &&
//                 compilerVersionNumber3 >= 5 &&
//                 compilerVersionNumber3 < 14
//               ) {
//                 target = 'petersburg'
//               } else {
//                 target = 'istanbul'
//               }
//             }
//             // verify all not verified contracts with the same deployed (runtime) bytecode
//             const matchedContracts = await getOnChainContractsByRuntimeBytecode(pool, onChainContractBytecode);
//             for (const matchedContractId of matchedContracts) {
//               //
//               // check standard ERC20 interface: https://ethereum.org/en/developers/docs/standards/tokens/erc-20/ 
//               //
//               // function name() public view returns (string)
//               // function symbol() public view returns (string)
//               // function decimals() public view returns (uint8)
//               // function totalSupply() public view returns (uint256)
//               // function balanceOf(address _owner) public view returns (uint256 balance)
//               // function transfer(address _to, uint256 _value) public returns (bool success)
//               // function transferFrom(address _from, address _to, uint256 _value) public returns (bool success)
//               // function approve(address _spender, uint256 _value) public returns (bool success)
//               // function allowance(address _owner, address _spender) public view returns (uint256 remaining)
//               //
//               let isErc20 = false;
//               let tokenName = null;
//               let tokenSymbol = null;
//               let tokenDecimals = null;
//               let tokenTotalSupply = null;

//               try {
//                 const contract = new ethers.Contract(
//                   matchedContractId,
//                   abi,
//                   provider
//                 );

//                 if (
//                   typeof contract['name'] === 'function'
//                   && typeof contract['symbol'] === 'function'
//                   && typeof contract['decimals'] === 'function'
//                   && typeof contract['totalSupply'] === 'function'
//                   && typeof contract['balanceOf'] === 'function'
//                   && typeof contract['transfer'] === 'function'
//                   && typeof contract['transferFrom'] === 'function'
//                   && typeof contract['approve'] === 'function'
//                   && typeof contract['allowance'] === 'function'
//                   && await contract.balanceOf('0x0000000000000000000000000000000000000000')
//                 ) {
//                   isErc20 = true;
//                   tokenName = await contract.name();
//                   tokenSymbol = await contract.symbol();
//                   tokenDecimals = await contract.decimals();
//                   tokenTotalSupply = await contract.totalSupply();
//                 }
//               } catch (error) {
//                 console.log('Error: ', error);
//               }
              
//               const query = `UPDATE contract SET
//                 name = $1,
//                 verified = $2,
//                 source = $3,
//                 compiler_version = $4,
//                 arguments = $5,
//                 optimization = $6,
//                 runs = $7,
//                 target = $8,
//                 abi = $9,
//                 license = $10,
//                 is_erc20 = $11,
//                 token_name = $12,
//                 token_symbol = $13,
//                 token_decimals = $14,
//                 token_total_supply = $15
//                 WHERE contract_id = $16;
//               `;
//               const data = [
//                 name,
//                 isVerified,
//                 source,
//                 compilerVersion,
//                 args,
//                 optimization,
//                 runs,
//                 target,
//                 abi,
//                 license,
//                 isErc20,
//                 tokenName ? tokenName.toString() : null,
//                 tokenSymbol ? tokenSymbol.toString() : null,
//                 tokenDecimals ? tokenDecimals.toString(): null,
//                 tokenTotalSupply ? tokenTotalSupply.toString() : null,
//                 matchedContractId
//               ];
//               await parametrizedDbQuery(pool, query, data);
//             }
//             await provider.api.disconnect();
//             await pool.query(query, data);
//             res.send({
//               status: true,
//               message: 'Success, contract is verified'
//             });
//           }
//         } else {
//           res.send({
//             status: false,
//             message: 'Error, contract is not verified'
//           });
//         }
//       } else {
//         res.send({
//           status: false,
//           message: 'There was an error processing the request'
//         });
//       }
//       await pool.end();
//     }
//   } catch (err) {
//     res.status(500).send(err);
//   }
// });
