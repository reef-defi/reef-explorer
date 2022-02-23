import * as Sentry from '@sentry/node';
import { Response, Request } from 'express';
import { findUserTokens, findUserContracts } from '../services/account';
import { AppRequest } from '../utils/types';
import { ensure, errorStatus } from '../utils/utils';

interface AccountAddress {
  address: string;
}

// interface UserPoolReq extends PoolReq {
//   userAddress: string;
// }

export const accountTokens = async (req: AppRequest<AccountAddress>, res: Response) => {
  try {
    ensure(!!req.body.address, 'Parameter address is missing');
    const tokens = await findUserTokens(req.body.address);
    res.send({ tokens: [...tokens] });
  } catch (err) {
    Sentry.captureException(err);
    res.status(errorStatus(err)).send(err.message);
  }
};

export const accountOwnedContracts = async (req: Request, res: Response) => {
  try {
    ensure(!!req.params.address, 'Url paramter account address is missing');
    const contracts = await findUserContracts(req.params.address);
    res.send({ contracts: [...contracts] });
  } catch (err) {
    Sentry.captureException(err);
    res.status(errorStatus(err)).send(err.message);
  }
};

// export const accountPool = async (req: AppRequest<UserPoolReq>, res: Response) => {
//   try {
//     ensure(!!req.body.userAddress, 'Parameter userAddress is missing');
//     ensure(!!req.body.tokenAddress1, "Parameter tokenAddress1 is missing");
//     ensure(!!req.body.tokenAddress1, "Parameter tokenAddress2 is missing");
//     const pool = await findUserPool(req.body.tokenAddress1, req.body.tokenAddress2, req.body.userAddress);
//     res.send(pool);
//   } catch (err) {
//     res.status(errorStatus(err)).send(err.message);
//   }
// };
