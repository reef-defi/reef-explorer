import { Response, NextFunction } from 'express';
import { authenticationToken } from '../services/utils';
import {
  contractVerificationRequestInsert,
  contractVerificationStatus,
  ensureVerificationRequest,
  findVeririedContract,
  verify,
} from '../services/verification';
import {
  AppRequest,
  AutomaticContractVerificationKey,
  AutomaticContractVerificationReq,
  ManualContractVerificationReq,
} from '../utils/types';
import { ensureObjectKeys, ensure, toChecksumAddress } from '../utils/utils';

interface ContractVerificationID {
  id: string;
}

const requiredArguments: AutomaticContractVerificationKey[] = [
  'address',
  'name',
  'runs',
  'filename',
  'source',
  'compilerVersion',
  'optimization',
  'arguments',
  'address',
  'target',
];

export const submitVerification = async (
  req: AppRequest<AutomaticContractVerificationReq>,
  res: Response,
  next: NextFunction,
) => {
  try {
    ensureObjectKeys(req.body, requiredArguments);
    req.body.address = toChecksumAddress(req.body.address);
    await verify(req.body);
    res.send('Verified');
  } catch (err) {
    if (err.status === 404) {
      await Promise.resolve()
        .then(() => ensureVerificationRequest(req.body))
        .then(() => contractVerificationRequestInsert({
          ...req.body,
          success: false,
          optimization: req.body.optimization === 'true',
          args: req.body.arguments,
          errorMessage: err.message,
        }))
        .catch();
    }
    next(err);
  }
};

export const formVerification = async (
  req: AppRequest<ManualContractVerificationReq>,
  res: Response,
  next: NextFunction,
) => {
  try {
    ensureObjectKeys(req.body, [...requiredArguments, 'token']);

    const isAuthenticated = await authenticationToken(req.body.token);
    ensure(isAuthenticated, 'Google Token Authentication failed!', 404);

    await verify(req.body);
    res.send('Verified');
  } catch (err) {
    if (err.status === 404) {
      await Promise.resolve()
        .then(() => ensureVerificationRequest(req.body))
        .then(() => contractVerificationRequestInsert({
          ...req.body,
          success: false,
          optimization: req.body.optimization === 'true',
          args: req.body.arguments,
          errorMessage: err.message,
        }))
        .catch();
    }
    next(err);
  }
};

export const verificationStatus = async (
  req: AppRequest<ContractVerificationID>,
  res: Response,
  next: NextFunction,
) => {
  try {
    ensure(!!req.body.id, 'Parameter id is missing');
    const status = await contractVerificationStatus(req.body.id);
    res.send(status);
  } catch (err) {
    next(err);
  }
};

export const getVerifiedContract = async (
  req: AppRequest<{}>,
  res: Response,
  next: NextFunction,
) => {
  try {
    ensure(!!req.params.address, 'Url paramter address is missing');
    const contracts = await findVeririedContract(
      toChecksumAddress(req.params.address),
    );
    ensure(contracts.length > 0, 'Contract does not exist');
    res.send(contracts[0]);
  } catch (err) {
    next(err);
  }
};
