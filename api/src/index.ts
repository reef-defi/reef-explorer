import express, {Response} from 'express';
import morgan from 'morgan';
import { compileContracts } from './compiler';
import { authenticationToken, config, getReefPrice, query } from './connector';
import { checkIfContractIsVerified, contractVerificationInsert, contractVerificationStatus, findContractBytecode, findPool, findStakingRewards, findUserPool, findUserTokens, updateContractStatus } from './queries';
import { AccountAddress, AppRequest, AutomaticContractVerificationReq, ContractVerificationID, License, ManualContractVerificationReq, PoolReq, UserPoolReq } from './types';
import { ensure, ensureObjectKeys, errorStatus } from './utils';

const cors = require('cors');
const app = express();

app.listen(config.httpPort, () => {
  console.log(`Timezones by location application is running on port ${config.httpPort}.`);
});

// Parse incoming requests with JSON payloads
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.post('/api/verificator/automatic-contract-verification', async (req: AppRequest<AutomaticContractVerificationReq>, res: Response) => {
  try {
    ensureObjectKeys(req.body, ["address", "name", "runs", "filename", "source", "compilerVersion", "optimization", "arguments", "address", "target"]);
    const optimization = req.body.optimization === "true";
    const bytecode = await compileContracts(
      req.body.name,
      req.body.filename,
      req.body.source,
      req.body.compilerVersion,
      req.body.target,
      optimization,
      req.body.runs
    );
    const verified = await checkIfContractIsVerified(bytecode);
    const status = verified ? "VERIFIED" : "NOT VERIFIED";
    const license: License = req.body.license ? req.body.license : "unlicense";
    await contractVerificationInsert({...req.body, optimization, license, status});
    const deployedBytecode = await findContractBytecode(req.body.address);
    ensure(deployedBytecode.includes(bytecode), "Contract sources does not match!", 404);
    res.send(status);
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
});

app.post('/api/verificator/manual-contract-verification', async (req: AppRequest<ManualContractVerificationReq>, res: Response) => {
  try {
    ensureObjectKeys(req.body, ["address", "name", "runs", "filename", "source", "compilerVersion", "optimization", 'token', "arguments", "address", "target"]);
    const isAuthenticated = await authenticationToken(req.body.token);
    ensure(isAuthenticated, "Google Token Authentication failed!", 404);
    const optimization = req.body.optimization === "true";
    const license: License = req.body.license ? req.body.license : "unlicense";
    const bytecode = await compileContracts(
      req.body.name,
      req.body.filename,
      req.body.source,
      req.body.compilerVersion,
      req.body.target,
      optimization,
      req.body.runs
    );
    ensure(bytecode.length > 0, "Compiler produced wrong output. Please contact reef team!", 404);
    const deployedBytecode = await findContractBytecode(req.body.address);
    const verified = deployedBytecode.includes(bytecode);
    const status = verified ? "VERIFIED" : "NOT VERIFIED";
    await contractVerificationInsert({...req.body, status, optimization, license});
    ensure(verified, "Contract sources does not match!", 404);
    await updateContractStatus(req.body.address, bytecode);
    res.send("Verified");
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
})
// app.post('/api/verificator/local-manual-contract-verification', async (req: AppRequest<AutomaticContractVerificationReq>, res: Response) => {
//   try {
//     ensureObjectKeys(req.body, ["address", "name", "runs", "filename", "source", "compilerVersion", "optimization", "arguments", "address", "target"]);
//     const optimization = req.body.optimization === "true";
//     const license: License = req.body.license ? req.body.license : "unlicense";
//     const bytecode = await compileContracts(
//       req.body.name,
//       req.body.filename,
//       req.body.source,
//       req.body.compilerVersion,
//       req.body.target,
//       optimization,
//       req.body.runs
//     );
//     ensure(bytecode.length > 0, "Compiler produced wrong output. Please contact reef team!", 404);
//     const deployedBytecode = await findContractBytecode(req.body.address);
//     const verified = deployedBytecode.includes(bytecode);
//     const status = verified ? "VERIFIED" : "NOT VERIFIED";
//     await contractVerificationInsert({...req.body, status, optimization, license});
//     ensure(verified, "Contract sources does not match!", 404);
//     await updateContractStatus(req.body.address, bytecode);
//     res.send("Verified");
//   } catch (err) {
//     console.log("ERROR: ", err);
//     res.status(errorStatus(err)).send(err.message);
//   }
// })

app.post('/api/verificator/status', async (req: AppRequest<ContractVerificationID>, res: Response) => {
  try {
    ensure(!!req.body.id, "Parameter id is missing");
    const status = await contractVerificationStatus(req.body.id);
    res.send(status);
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
})

app.post('/api/account/tokens', async (req: AppRequest<AccountAddress>, res: Response) => {
  try {
    ensure(!!req.body.address, "Parameter address is missing");
    const tokens = await findUserTokens(req.body.address);
    res.send({tokens: [...tokens]});
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
});

app.post('/api/pool', async (req: AppRequest<PoolReq>, res: Response) => {
  try {
    ensure(!!req.body.tokenAddress1, "Parameter tokenAddress1 is missing");
    ensure(!!req.body.tokenAddress1, "Parameter tokenAddress2 is missing");
    const pool = await findPool(req.body.tokenAddress1, req.body.tokenAddress2);
    res.send(pool);
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
});

app.post('/api/user/pool', async (req: AppRequest<UserPoolReq>, res: Response) => {
  try { 
    ensure(!!req.body.userAddress, 'Parameter userAddress is missing');
    ensure(!!req.body.tokenAddress1, "Parameter tokenAddress1 is missing");
    ensure(!!req.body.tokenAddress1, "Parameter tokenAddress2 is missing");
    const pool = await findUserPool(req.body.tokenAddress1, req.body.tokenAddress2, req.body.userAddress);
    res.send(pool);
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
});

app.get('/api/price/reef', async (_, res) => {
  try {
    const price = await getReefPrice();
    res.send(price);    
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
});

app.get('/api/staking/rewards', async (_, res) => {
  try {
    const rewards = await findStakingRewards();
    res.send({rewards: [...rewards]});
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
});

// TODO db testing
app.get('/api/test', async (_, res) => {
  try {
    const result = await query("SELECT * FROM contract WHERE contract_id = $1", ["0x49251e3df078cAAfC803F92cD2F50441eF378868"]);
    res.send(result)
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
})