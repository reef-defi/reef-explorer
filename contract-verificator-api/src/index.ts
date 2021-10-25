import express, {Response, Request} from 'express';
import { compileSources } from './compiler';
import { authenticationToken, connect, getReefPrice } from './connector';
import { checkIfContractIsVerified, contractVerificationInsert, contractVerificationStatus, findStakingRewards, findUserTokens, updateContractsVerificationStatus } from './queries';
import { AccountAddress, AppRequest, AutomaticContractVerificationReq, ContractVerificationID, ManualContractVerificationReq } from './types';
import { ensure, ensureObjectKeys } from './utils';

const app = express();
const port = 3000;

app.listen(port, () => {
  console.log(`Timezones by location application is running on port ${port}.`);
});

// Parse incoming requests with JSON payloads
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.post('/api/verificator/automatic-contract-verification', async (req: AppRequest<AutomaticContractVerificationReq>, res: Response) => {
  try {
    ensureObjectKeys(req.body, ["runs", "filename", "source", "compilerVersion", "optimization"]);
    const bytecode = await compileSources(
      req.body.filename, // TODO get contract name!
      req.body.filename,
      JSON.parse(req.body.source),
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
    ensureObjectKeys(req.body, ["runs", "filename", "source", "compilerVersion", "optimization", 'token']);
    const isAuthenticated = await authenticationToken(req.body.token);
    ensure(isAuthenticated, "Google Token Authentication failed!");
  
    const bytecode = await compileSources(
      req.body.filename, // TODO get contract name!
      req.body.filename,
      JSON.parse(req.body.source),
      req.body.compilerVersion,
      req.body.optimization,
      req.body.runs
    );
  
    await contractVerificationInsert({...req.body, status: 'VERIFIED'});
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
    const rewards = await findStakingRewards();
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

