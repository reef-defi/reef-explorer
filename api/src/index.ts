import express, {Response} from 'express';
import { compileContracts } from './compiler';
import { authenticationToken, config, getReefPrice, query } from './connector';
import { checkIfContractIsVerified, contractVerificationInsert, contractVerificationStatus, findPool, findStakingRewards, findUserPool, findUserTokens, updateContractStatus } from './queries';
import { AccountAddress, AppRequest, AutomaticContractVerificationReq, ContractVerificationID, ManualContractVerificationReq, PoolReq, UserPoolReq } from './types';
import { ensure, ensureObjectKeys } from './utils';

const app = express();

app.listen(config.httpPort, () => {
  console.log(`Timezones by location application is running on port ${config.httpPort}.`);
});

// Parse incoming requests with JSON payloads
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.post('/api/verificator/automatic-contract-verification', async (req: AppRequest<AutomaticContractVerificationReq>, res: Response) => {
  try {
    ensureObjectKeys(req.body, ["name", "runs", "filename", "source", "compilerVersion", "optimization", "arguments", "address", "license", "target"]);
    const optimization = req.body.optimization === "true";
    const bytecode = await compileContracts(
      req.body.name,
      req.body.filename,
      req.body.source,
      req.body.compilerVersion,
      optimization,
      req.body.runs
    );
    const verified = await checkIfContractIsVerified(bytecode);
    const status = verified ? "VERIFIED" : "NOT VERIFIED"; // TODO
    await contractVerificationInsert({...req.body, optimization, status});
    res.send(status);
  } catch (err) {
    console.error(err);
    res.status(400).send(err.message);
  }
});

app.post('/api/verificator/manual-contract-verification', async (req: AppRequest<ManualContractVerificationReq>, res: Response) => {
  try {
    ensureObjectKeys(req.body, ["runs", "filename", "source", "compilerVersion", "optimization", 'token', "arguments", "address", "license", "target"]);
    const isAuthenticated = await authenticationToken(req.body.token);
    ensure(isAuthenticated, "Google Token Authentication failed!");
    const optimization = req.body.optimization === "true";
    const bytecode = await compileContracts(
      req.body.name,
      req.body.filename,
      req.body.source,
      req.body.compilerVersion,
      optimization,
      req.body.runs
    );
    await contractVerificationInsert({...req.body, status: 'VERIFIED', optimization});
    await updateContractStatus(req.body.address, bytecode);
    res.send("Verified");
  } catch (err) {
    console.error(err);
    res.status(400).send(err.message);
  }
})

app.post('/api/verificator/status', async (req: AppRequest<ContractVerificationID>, res: Response) => {
  try {
    ensure(!!req.body.id, "Parameter id is missing");
    const status = await contractVerificationStatus(req.body.id);
    res.send(status);
  } catch (err) {
    res.status(400).send(err.message);
  }
})

app.post('/api/account/tokens', async (req: AppRequest<AccountAddress>, res: Response) => {
  try {
    ensure(!!req.body.address, "Parameter address is missing");
    const tokens = await findUserTokens(req.body.address);
    res.send({tokens: [...tokens]});
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.post('/api/pool', async (req: AppRequest<PoolReq>, res: Response) => {
  try {
    ensure(!!req.body.tokenAddress1, "Parameter tokenAddress1 is missing");
    ensure(!!req.body.tokenAddress1, "Parameter tokenAddress2 is missing");
    const pool = await findPool(req.body.tokenAddress1, req.body.tokenAddress2);
    res.send(pool);
  } catch (err) {
    res.status(400).send(err.message);
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
    res.status(400).send(err.message);
  }
});

app.get('/api/price/reef', async (_, res) => {
  try {
    const price = await getReefPrice();
    res.send(price);    
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.get('/api/staking/rewards', async (_, res) => {
  try {
    const rewards = await findStakingRewards();
    res.send({rewards: [...rewards]});
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// TODO db testing
// app.get('/api/test', async (_, res) => {
//   try {
//     const result = await query("SELECT DISTINCT status FROM contract_verification_request", []);
//     console.log(result);
//     res.send(result)
//   } catch (err) {
//     console.log(err);
//     res.status(400).send(err.message);
//   }
// })