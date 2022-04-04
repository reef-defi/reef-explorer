import { SpRuntimeDispatchError } from '@polkadot/types/lookup';
import { BigNumber } from 'ethers';
import {
  Extrinsic,
  Event,
  ExtrinsicStatus,
  ExtrinsicBody,
  Transfer,
} from './types';
import { REEF_CONTRACT_ADDRESS } from '../utils/utils';
import { nodeProvider } from '../utils/connector';

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
        && nodeProvider.getProvider().api.events.system.ExtrinsicSuccess.is(event)
    ) {
      return { type: 'success' };
    } if (nodeProvider.getProvider().api.events.system.ExtrinsicFailed.is(event)) {
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

export const isExtrinsicNativeTransfer = ({ extrinsic }: ExtrinsicBody): boolean => extrinsic.method.section === 'balances'
  || extrinsic.method.section === 'currencies';

export const extrinsicBodyToTransfer = async ({
  id,
  status,
  blockId,
  extrinsic,
  timestamp,
  signedData,
}: ExtrinsicBody): Promise<Transfer> => {
  const args: any = extrinsic.args.map((arg) => arg.toJSON());

  const toAddress = args[0]?.id || 'deleted';
  const fromAddress = resolveSigner(extrinsic);

  const toEvmAddress = toAddress !== 'deleted'
    ? (await nodeProvider.query((provider) => provider.api.query.evmAccounts.evmAddresses(toAddress))).toString()
    : 'null';
  const fromEvmAddress = fromAddress !== 'deleted'
    ? (await nodeProvider.query((provider) => provider.api.query.evmAccounts.evmAddresses(fromAddress))).toString()
    : 'null';

  const amount = BigNumber.from(args[args.length-1]).toString();
  const feeAmount = BigNumber.from(signedData!.fee.partialFee).toString();
  const denom = extrinsic.method.section === 'currencies' ? args[1].token : 'REEF';

  return {
    denom,
    amount,
    blockId,
    feeAmount,
    timestamp,
    toAddress,
    fromAddress,
    toEvmAddress,
    fromEvmAddress,
    extrinsicId: id,
    success: status.type === 'success',
    tokenAddress: REEF_CONTRACT_ADDRESS,
    errorMessage: status.type === 'error' ? status.message : '',
    type: 'Native',
  };
};
