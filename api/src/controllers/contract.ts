import { Response, NextFunction } from "express";
import {
  findContractDB,
  findERC20Token,
  findTokenAccountTokenBalance,
  findTokenInfo,
  getERC20Tokens,
} from "../services/contract";
import { AppRequest, TokenBalanceParam } from "../utils/types";
import { ensure, toChecksumAddress } from "../utils/utils";
import { accountTokenBodyValidator, validateData } from "./validators";

export const findToken = async (
  req: AppRequest<{}>,
  res: Response,
) => {
    ensure(!!req.params.address, "Url paramter address is missing");
    const token = await findTokenInfo(toChecksumAddress(req.params.address));
    res.send(token);
};

export const findContract = async (
  req: AppRequest<{}>,
  res: Response,
) => {
    ensure(!!req.params.address, "Url paramter address is missing");
    const contracts = await findContractDB(req.params.address);
    ensure(contracts.length > 0, "Contract does not exist");
    res.send(contracts[0]);
};

export const getAllERC20Tokens = async (
  _,
  res: Response,
) => {
  const tokens = await getERC20Tokens();
  res.send({ tokens: [...tokens] });
};

export const accountTokenBalance = async (
  req: AppRequest<TokenBalanceParam>,
  res: Response,
): Promise<void> => {
  validateData(req.body, accountTokenBodyValidator);

  const tokenBalances = await findTokenAccountTokenBalance(
    req.body.accountAddress.toLowerCase(),
    toChecksumAddress(req.body.contractAddress)
  );

  if (tokenBalances.length === 0) {
    const token = await findERC20Token(req.body.contractAddress);
    res.send({ balance: 0, decimals: token.decimals });
  } else {
    res.send({
      balance: tokenBalances[0].balance,
      decimals: tokenBalances[0].info.decimals || 0,
    });
  }
};
