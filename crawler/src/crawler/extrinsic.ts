import { SpRuntimeDispatchError } from '@polkadot/types/lookup';
import { BigNumber } from 'ethers';
import {
  Extrinsic,
  Event,
  ExtrinsicStatus,
  ExtrinsicBody,
  Transfer,
} from './types';
import { getProvider } from '../utils/connector';

export const resolveSigner = (extrinsic: Extrinsic): string => extrinsic.signer?.toString() || 'deleted';

const extractErrorMessage = (error: SpRuntimeDispatchError): string => {
  if (error.isModule) {
    const errorModule = error.asModule;
    const { docs, name, section } = errorModule.registry.findMetaError(errorModule);
    return `${section}.${name}: ${docs}`;
  }
  return error.toString();
};

export const extrinsicStatus = (extrinsicEvents: Event[]): ExtrinsicStatus => extrinsicEvents.reduce(
  (prev, { event }) => {
    if (
      prev.type === 'unknown'
        && getProvider().api.events.system.ExtrinsicSuccess.is(event)
    ) {
      return { type: 'success' };
    } if (getProvider().api.events.system.ExtrinsicFailed.is(event)) {
      const [dispatchedError] = event.data;
      return {
        type: 'error',
        message: extractErrorMessage(dispatchedError),
      };
    }
    return prev;
  },
    { type: 'unknown' } as ExtrinsicStatus,
);

export const isExtrinsicTransfer = ({ extrinsic }: ExtrinsicBody): boolean => extrinsic.method.section === 'balances'
  || extrinsic.method.section === 'currencies';

export const extrinsicBodyToTransfer = ({
  id,
  status,
  blockId,
  extrinsic,
  timestamp,
  signedData,
}: ExtrinsicBody): Transfer => {
  const args: any = extrinsic.args.map((arg) => arg.toJSON());

  const toAddress = args[0]?.id || 'deleted';
  const fromAddress = resolveSigner(extrinsic);

  const denom: string = extrinsic.method.section === 'currencies' ? args[1].token : 'REEF';
  const amount: string = BigNumber.from(
    extrinsic.method.section === 'currencies' ? args[2] : args[1],
  ).toString();
  const feeAmount = BigNumber.from(signedData!.fee.partialFee).toString();
  const tokenAddress = '0x0000000000000000000000000000000001000000';

  return {
    denom,
    amount,
    blockId,
    feeAmount,
    timestamp,
    toAddress,
    fromAddress,
    tokenAddress,
    extrinsicId: id,
    success: status.type === 'success',
    errorMessage: status.type === 'error' ? status.message : '',
  };
};
