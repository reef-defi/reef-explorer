import express, {Response} from 'express';
import { compileSources } from './compiler';
import { authenticationToken, getReefPrice } from './connector';
import { checkIfContractIsVerified, contractVerificationInsert, contractVerificationStatus, findStakingRewards, findUserTokens, updateContractsVerificationStatus } from './queries';
import { AccountAddress, AppRequest, AutomaticContractVerificationReq, ContractVerificationID, ManualContractVerificationReq } from './types';
import { ensure } from './utils';

const app = express();
const port = 3000;

app.listen(port, () => {
  console.log(`Timezones by location application is running on port ${port}.`);
});

app.use('/', (err, req, res, next) => {
  console.error(err);
  res.status(404).send(err.message);
})


app.post('/api/verificator/automatic-contract-verification', async (req: AppRequest<AutomaticContractVerificationReq>, res: Response) => {
  const bytecode = await compileSources(
    req.body.filename, // TODO get contract name!
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
});

app.post('/api/verificator/manual-contract-verification', async (req: AppRequest<ManualContractVerificationReq>, res: Response) => {
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
  res.send();
})

app.post('/api/verificator/status', async (req: AppRequest<ContractVerificationID>, res: Response) => {
  const status = await contractVerificationStatus(req.body.id);
  res.send(status);
})

app.post('/api/account/tokens', async (req: AppRequest<AccountAddress>, res: Response) => {
  const tokens = await findUserTokens(req.body.address);
  res.send({tokens: [...tokens]});
});

app.get('/api/price/reef', async (_, res) => {
  const price = await getReefPrice();
  res.send(price);    
});

app.get('/api/staking/rewards', async (_, res) => {
  const rewards = await findStakingRewards();
  res.send({rewards: [...rewards]});
});