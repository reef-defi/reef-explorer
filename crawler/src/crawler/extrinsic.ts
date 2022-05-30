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
