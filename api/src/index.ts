import express, {Response} from 'express';
import morgan from 'morgan';
import { verifyContractArguments } from './compiler/argumentEncoder';
import { verifyContract } from './compiler/compiler';
import { checkIfContractIsERC20, extractERC20ContractData } from './compiler/erc-checkers';
import { APP_CONFIGURATION } from './config';
import { authenticationToken, getReefPrice, query } from './connector';
import { contractVerificationInsert, contractVerificationStatus, findContractBytecode, findPool, findStakingRewards, findTokenInfo, findUserPool, findUserTokens, insertErc20Token, updateContractStatus } from './queries';
import { AccountAddress, AppRequest, AutomaticContractVerificationReq, ContractVerificationID, ManualContractVerificationReq, PoolReq, UserPoolReq } from './types';
import { ensure, ensureObjectKeys, errorStatus } from './utils';

const cors = require('cors');
const app = express();

app.listen(APP_CONFIGURATION.httpPort, () => {
  console.log(`Reef explorer API is running on port ${APP_CONFIGURATION.httpPort}.`);
});

// Parse incoming requests with JSON payloads
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));


// const deployedBytecode = await findContractBytecode(address);

// TODO 
// TODO decompile constructorBytecode and check if the user arguments are the same 
// TODO extract all compiled core bytecodes and try to remove them from deployed bytecode
// TODO stich all the metadata parts
// TODO check what is left (only metadata should stay) if nothing is there contract is verified 100%
// const deployedBytecode = await findContractBytecode(address);

const verify = async (verification: AutomaticContractVerificationReq): Promise<void> => {
  const deployedBytecode = await findContractBytecode(verification.address);
  const {abi, fullAbi} = await verifyContract(deployedBytecode, verification);
  verifyContractArguments(deployedBytecode, abi, verification.arguments);
  
  if (checkIfContractIsERC20(abi)) {
    const data = await extractERC20ContractData(verification.address, abi);
    await insertErc20Token(verification.address, data);
  }

  await updateContractStatus({...verification, abi: fullAbi, optimization: verification.optimization === "true"});
  await contractVerificationInsert({...verification, status: "VERIFIED", optimization: verification.optimization === "true"})
}

app.post('/api/verificator/submit-verification', async (req: AppRequest<AutomaticContractVerificationReq>, res: Response) => {
  try {
    ensureObjectKeys(req.body, ["address", "name", "runs", "filename", "source", "compilerVersion", "optimization", "arguments", "address", "target"]);
    await verify(req.body);
    res.send("Verified");
  } catch (err) {
    console.log(err);
    if (err.status === 404) {
      await contractVerificationInsert({...req.body, status: "NOT VERIFIED", optimization: req.body.optimization === "true"})
    }
    res.status(errorStatus(err)).send({message: err.message});
  }
});

app.post('/api/verificator/form-verification', async (req: AppRequest<ManualContractVerificationReq>, res: Response) => {
  try {
    ensureObjectKeys(req.body, ["address", "name", "runs", "filename", "source", "compilerVersion", "optimization", 'token', "arguments", "address", "target"]);
    
    const isAuthenticated = await authenticationToken(req.body.token);
    ensure(isAuthenticated, "Google Token Authentication failed!", 404);
    
    await verify(req.body);
    res.send("Verified");
  } catch (err) {
    if (err.status === 404) {
      await contractVerificationInsert({...req.body, status: "NOT VERIFIED", optimization: req.body.optimization === "true"})
    }
    res.status(errorStatus(err)).send(err.message);
  }
})

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

app.get('/api/price/reef', async (_, res: Response) => {
  try {
    const price = await getReefPrice();
    res.send(price);    
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
});

app.get('/api/staking/rewards', async (_, res: Response) => {
  try {
    const rewards = await findStakingRewards();
    res.send({rewards: [...rewards]});
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
});

app.get('/api/token/:address', async (req: AppRequest<{}>, res: Response) => {
  try {
    ensure(!!req.params.address, "Url paramter address is missing");
    // const deployedBytecode = await findContractBytecode(req.params.address);
    const token = await findTokenInfo(req.params.address);

    res.send(token);
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
});

// TODO db testing
// app.get('/api/test/erc20-contracts', async (_, res) => {
//   try {
//     const result = await query("SELECT e.contract_id, e.name, e.symbol FROM contract as c INNER JOIN erc20 as e ON c.contract_id = e.contract_id;", []);
//     res.send(result)
//   } catch (err) {
//     console.log(err);
//     res.status(errorStatus(err)).send(err.message);
//   }
// })
// app.get('/api/test/contracts', async (_, res) => {
//   try {
//     const result = await query("SELECT * FROM contract LIMIT 1;", []);
//     res.send(result)
//   } catch (err) {
//     console.log(err);
//     res.status(errorStatus(err)).send(err.message);
//   }
// })
// app.get('/api/test/token-holders', async (_, res) => {
//   try {
//     const result = await query("SELECT contract_id FROM token_holder;", []);
//     res.send(result)
//   } catch (err) {
//     console.log(err);
//     res.status(errorStatus(err)).send(err.message);
//   }
// })
// app.get('/api/test/cvr', async (_, res) => {
//   try {
//     const result = await query("SELECT * FROM contract_verification_request;", []);
//     res.send(result)
//   } catch (err) {
//     console.log(err);
//     res.status(errorStatus(err)).send(err.message);
//   }
// })
