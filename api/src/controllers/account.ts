import { Response } from 'express';
import { findUserTokens, findUserContracts } from '../services/account';
import { AppRequest } from '../utils/types';
import { nativeAddressValidator, validateData } from './validators';

interface AccountAddress {
  address: string;
}

export const accountTokens = async (req: AppRequest<AccountAddress>, res: Response) => {
  validateData(req.body.address, nativeAddressValidator);
  const tokens = await findUserTokens(req.body.address);
  res.send({ tokens: [...tokens] });
};

export const accountOwnedContracts = async (req: AppRequest<{}>, res: Response) => {
  validateData(req.params.address, nativeAddressValidator);
  const contracts = await findUserContracts(req.params.address);
  res.send({ contracts: [...contracts] });
};
