import { Response } from 'express';
import { authenticationToken } from '../services/utils';
import {
  contractVerificationRequestInsert,
  contractVerificationStatus,
  findVeririedContract,
  verify,
} from '../services/verification';
import {
  AppRequest,
  AutomaticContractVerificationReq,
  ManualContractVerificationReq,
} from '../utils/types';
import { ensure, toChecksumAddress } from '../utils/utils';
import {
  automaticVerificationValidator, formVerificationValidator, idValidator, validateData, verificationStatusValidator,
} from './validators';

interface ContractVerificationID {
  id: string;
}

export const submitVerification = async (
  req: AppRequest<AutomaticContractVerificationReq>,
  res: Response,
) => {
  validateData(req.body, automaticVerificationValidator);

  req.body.address = toChecksumAddress(req.body.address);

  await verify(req.body)
    .catch(async (err) => {
      await contractVerificationRequestInsert({
        ...req.body,
        success: false,
        args: req.body.arguments,
        errorMessage: err.message,
        optimization: req.body.optimization === 'true',
      });
      throw err;
    });
  res.send('Verified');
};

export const formVerification = async (
  req: AppRequest<ManualContractVerificationReq>,
  res: Response,
) => {
  validateData(req.body, formVerificationValidator);

  const isAuthenticated = await authenticationToken(req.body.token);
  ensure(isAuthenticated, 'Google Token Authentication failed!', 404);

  await verify(req.body)
    .catch(async (err) => {
      await contractVerificationRequestInsert({
        ...req.body,
        success: false,
        optimization: req.body.optimization === 'true',
        args: JSON.stringify(req.body.arguments),
        source: JSON.stringify(req.body.source),
        errorMessage: err.message,
      });
      throw err;
    });
  res.send('Verified');
};

export const verificationStatus = async (
  req: AppRequest<ContractVerificationID>,
  res: Response,
) => {
  validateData(req.body, idValidator);
  const status = await contractVerificationStatus(req.body.id);
  res.send(status);
};

export const getVerifiedContract = async (
  req: AppRequest<{}>,
  res: Response,
) => {
  validateData(req.body, verificationStatusValidator);

  const contracts = await findVeririedContract(
    toChecksumAddress(req.params.address),
  );
  ensure(contracts.length > 0, 'Contract does not exist');
  res.send(contracts[0]);
};
