import { Response } from "express";
import { findContractDB, findERC20Token, findPoolQuery, findStakingRewards, findTokenAccountTokenBalance, findTokenInfo, getERC20Tokens } from "../services/contract";
import { queryDb } from "../utils/connector";
import { AppRequest, PoolReq } from "../utils/types";
import { ensure, ensureObjectKeys, errorStatus } from "../utils/utils";

// export const findPool = async (req: AppRequest<PoolReq>, res: Response) => {
//   try {
//     ensure(!!req.body.tokenAddress1, "Parameter tokenAddress1 is missing");
//     ensure(!!req.body.tokenAddress1, "Parameter tokenAddress2 is missing");
//     const pool = await findPoolQuery(req.body.tokenAddress1, req.body.tokenAddress2);
//     res.send(pool);
//   } catch (err) {
//     res.status(errorStatus(err)).send(err.message);
//   }
// };

// export const stakingRewards = async (_, res: Response) => {
//   try {
//     const rewards = await findStakingRewards();
//     res.send({rewards: [...rewards]});
//   } catch (err) {
//     res.status(errorStatus(err)).send(err.message);
//   }
// };

export const findToken = async (req: AppRequest<{}>, res: Response) => {
  try {
    ensure(!!req.params.address, "Url paramter address is missing");
    // const deployedBytecode = await findContractBytecode(req.params.address);
    const token = await findTokenInfo(req.params.address);

    res.send(token);
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
};

export const findContract = async (req: AppRequest<{}>, res: Response) => {
  try {
    ensure(!!req.params.address, "Url paramter address is missing");
    // const deployedBytecode = await findContractBytecode(req.params.address);
    const contracts = await findContractDB(req.params.address.toLowerCase());
    ensure(contracts.length > 0, 'Contract does not exist');

    res.send(contracts[0]);
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
}

export const getAllERC20Tokens = async (_, res: Response) => {
  try {
    const tokens = await getERC20Tokens();
    res.send({tokens: [...tokens]});
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
}

interface TokenBalanceParam {
  accountAddress: string;
  contractAddress: string;
}

export const accountTokenBalance =async (req: AppRequest<TokenBalanceParam>, res: Response): Promise<void> => {
  try {
    ensureObjectKeys(req.body, ["accountAddress", "contractAddress"]);
    const tokenBalances = await findTokenAccountTokenBalance(req.body.accountAddress.toLowerCase(), req.body.contractAddress.toLowerCase());
    
    if (tokenBalances.length === 0) {
      const decimals = await findERC20Token(req.body.contractAddress);
      res.send({balance: 0, decimals});
    }
    res.send({balance: tokenBalances[0].balance, decimals: tokenBalances[0].decimals});
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
}