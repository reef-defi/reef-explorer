import express, {Response, Request} from 'express';
import { compileContracts } from './compiler';
import { authenticationToken, config, connect, getReefPrice } from './connector';
import { checkIfContractIsVerified, contractVerificationInsert, contractVerificationStatus, findStakingRewards, findUserTokens, updateContractsVerificationStatus } from './queries';
import { AccountAddress, AppRequest, AutomaticContractVerificationReq, ContractVerificationID, ManualContractVerificationReq } from './types';
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
    ensureObjectKeys(req.body, ["name", "runs", "filename", "source", "compilerVersion", "optimization", "args", "address"]);
    const {abi, bytecode} = await compileContracts(
      req.body.name,
      req.body.filename,
      req.body.source,
      req.body.compilerVersion,
      req.body.optimization,
      req.body.runs
    );
    // const verified = await checkIfContractIsVerified(bytecode);
    const verified = "VERIFIED";
    const status = verified ? "VERIFIED" : "NOT VERIFIED"; // TODO
    // await contractVerificationInsert({...req.body, status});
    res.send(status);
  } catch (err) {
    console.error(err);
    res.status(400).send(err.message);
  }
});

app.post('/api/verificator/manual-contract-verification', async (req: AppRequest<ManualContractVerificationReq>, res: Response) => {
  try {
    ensureObjectKeys(req.body, ["runs", "filename", "source", "compilerVersion", "optimization", 'token', "args", "address"]);
    const isAuthenticated = await authenticationToken(req.body.token);
    ensure(isAuthenticated, "Google Token Authentication failed!");
  
    const {bytecode} = await compileContracts(
      req.body.name,
      req.body.filename,
      req.body.source,
      req.body.compilerVersion,
      req.body.optimization,
      req.body.runs
    );
    // TODO license
    await contractVerificationInsert({...req.body, status: 'VERIFIED', license: "MIT"});
    await updateContractsVerificationStatus(bytecode);
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
    ensure(!!req.body.address, "Parameter id is missing");
    const tokens = await findUserTokens(req.body.address);
    res.send({tokens: [...tokens]});
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
    console.log("Hello");
    const rewards = await findStakingRewards();
    console.log("rewards: ", rewards);
    res.send({rewards: [...rewards]});
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.get('/api/test', async (_, res) => {
  try {
    console.log("Connecting")
    const db = await connect();
    console.log(db)
  } catch (err) {
    console.error(err);
    res.status(400).send(err.message);
  }
});

