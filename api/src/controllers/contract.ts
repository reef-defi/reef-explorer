import { Response } from "express";
import { findPoolQuery, findStakingRewards, findTokenInfo } from "../services/contract";
import { AppRequest, PoolReq } from "../utils/types";
import { ensure, errorStatus } from "../utils/utils";

export const findPool = async (req: AppRequest<PoolReq>, res: Response) => {
  try {
    ensure(!!req.body.tokenAddress1, "Parameter tokenAddress1 is missing");
    ensure(!!req.body.tokenAddress1, "Parameter tokenAddress2 is missing");
    const pool = await findPoolQuery(req.body.tokenAddress1, req.body.tokenAddress2);
    res.send(pool);
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
};

export const stakingRewards = async (_, res: Response) => {
  try {
    const rewards = await findStakingRewards();
    res.send({rewards: [...rewards]});
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
};

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