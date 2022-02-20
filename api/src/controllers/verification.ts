import { Response } from 'express';
import { authenticationToken } from '../services/utils';
import {
  contractVerificationRequestInsert,
  contractVerificationStatus, findVeririedContract, verify,
} from '../services/verification';
import { AppRequest, AutomaticContractVerificationReq, ManualContractVerificationReq } from '../utils/types';
import {
  ensureObjectKeys, errorStatus, ensure, toChecksumAddress,
} from '../utils/utils';

interface ContractVerificationID {
  id: string;
}

export const submitVerification = async (req: AppRequest<AutomaticContractVerificationReq>, res: Response) => {
  try {
    ensureObjectKeys(req.body, ['address', 'name', 'runs', 'filename', 'source', 'compilerVersion', 'optimization', 'arguments', 'address', 'target']);
    req.body.address = toChecksumAddress(req.body.address);
    await verify(req.body);
    res.send('Verified');
  } catch (err) {
    console.log(err);
    if (err.status === 404) {
      await contractVerificationRequestInsert({
        ...req.body, success: false, optimization: req.body.optimization === 'true', args: req.body.arguments, errorMessage: err.message,
      });
    }
    res.status(errorStatus(err)).send({ message: err.message });
  }
};

export const formVerification = async (req: AppRequest<ManualContractVerificationReq>, res: Response) => {
  try {
    ensureObjectKeys(req.body, ['address', 'name', 'runs', 'filename', 'source', 'compilerVersion', 'optimization', 'token', 'arguments', 'address', 'target']);

    const isAuthenticated = await authenticationToken(req.body.token);
    ensure(isAuthenticated, 'Google Token Authentication failed!', 404);

    await verify(req.body);
    res.send('Verified');
  } catch (err) {
    if (err.status === 404) {
      await contractVerificationRequestInsert({
        ...req.body, success: false, optimization: req.body.optimization === 'true', args: req.body.arguments, errorMessage: err.message,
      });
    }
    res.status(errorStatus(err)).send(err.message);
  }
};

export const verificationStatus = async (req: AppRequest<ContractVerificationID>, res: Response) => {
  try {
    ensure(!!req.body.id, 'Parameter id is missing');
    const status = await contractVerificationStatus(req.body.id);
    res.send(status);
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
};

export const getVerifiedContract = async (req: AppRequest<{}>, res: Response) => {
  try {
    ensure(!!req.params.address, 'Url paramter address is missing');
    const contracts = await findVeririedContract(toChecksumAddress(req.params.address));
    ensure(contracts.length > 0, 'Contract does not exist');
    res.send(contracts[0]);
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
};
