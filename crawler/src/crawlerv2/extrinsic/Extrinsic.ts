import { GenericExtrinsic } from '@polkadot/types/extrinsic';
import { SpRuntimeDispatchError } from '@polkadot/types/lookup';
import { AnyTuple } from '@polkadot/types/types';
import { ExtrinsicStatus, SignedExtrinsicData } from "../../crawler/types";
import { insertExtrinsic } from "../../queries/extrinsic";
import { nodeProvider } from "../../utils/connector";
import logger from "../../utils/logger";
import AccountManager from "../managers/AccountManager";
import DefaultEvent from "./event/DefaultEvent";

type Extr = GenericExtrinsic<AnyTuple>

const extractErrorMessage = (error: SpRuntimeDispatchError): string => {
  if (error.isModule) {
    const errorModule = error.asModule;
    const { docs, name, section } = errorModule.registry.findMetaError(errorModule);
    return `${section}.${name}: ${docs}`;
  }
  return error.toString();
};

const extrinsicStatus = (extrinsicEvents: DefaultEvent[]): ExtrinsicStatus => extrinsicEvents.reduce(
  (prev, { head: { event: { event } } }) => {
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

class Extrinsic {
  id?: number;
  index: number;
  blockId: number;
  timestamp: string;
  extrinsic: Extr;
  // head: ExtrinsicHead;
  events: DefaultEvent[];
  status?: ExtrinsicStatus;
  signedData?: SignedExtrinsicData;

  constructor(blockId: number, index: number, timestamp: string, extrinsic: Extr, events: DefaultEvent[]) {
    this.events = events;
    this.blockId = blockId;
    this.index = index;
    this.timestamp = timestamp;
    this.extrinsic = extrinsic;
  }

  private async getSignedData(hash: string): Promise<SignedExtrinsicData> {
    const [fee, feeDetails] = await Promise.all([
      nodeProvider.query((provider) => provider.api.rpc.payment.queryInfo(hash)),
      nodeProvider.query((provider) => provider.api.rpc.payment.queryFeeDetails(hash)),
    ]);
  
    return {
      fee: fee.toJSON(),
      feeDetails: feeDetails.toJSON(),
    };
  }

  async process(accountsManager: AccountManager): Promise<void> {
    // Extracting signed data
    this.signedData = this.extrinsic.isSigned
      ? await this.getSignedData(this.extrinsic.toHex())
      : undefined;
    
    this.status = extrinsicStatus(this.events);
    // Process all extrinsic events 
    await Promise.all(this.events.map(async (event) => event.process(accountsManager)));
  }

  async save(): Promise<void> {
    if (!this.id) {
      throw new Error('Extrinsic id was not claimed!');
    }
    if (!this.status) {
      throw new Error('Extrinsic status was not claimed!');
    }

    logger.info('Inserting extrinsic');
    await insertExtrinsic({
      id: this.id,
      index: this.index,
      blockId: this.blockId,
      signedData: this.signedData,
      timestamp: this.timestamp,
      status: this.status.type,
      hash: this.extrinsic.hash.toString(),
      method: this.extrinsic.method.method,
      section: this.extrinsic.method.section,
      args: JSON.stringify(this.extrinsic.args),
      docs: this.extrinsic.meta.docs.toLocaleString(),
      signed: this.extrinsic.signer?.toString() || 'deleted',
      errorMessage: this.status.type === 'error' ? this.status.message : '',
    });
    const extrinsicData = {
      id: this.id,
      index: this.index,
      signedData: this.signedData,
      status: this.status
    }
    await Promise.all(this.events.map(async (event) => event.save(extrinsicData)));
  }
}

export default Extrinsic;