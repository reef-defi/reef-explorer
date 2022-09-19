import { GenericExtrinsic } from '@polkadot/types/extrinsic';
import { SpRuntimeDispatchError } from '@polkadot/types/lookup';
import { AnyTuple } from '@polkadot/types/types';
import { ExtrinsicStatus, SignedExtrinsicData } from '../../crawler/types';
import { nodeProvider, queryv2 } from '../../utils/connector';
import logger from '../../utils/logger';
import AccountManager from '../managers/AccountManager';
import { ExtrinsicData } from '../types';
import DefaultEvent from './event/DefaultEvent';

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

  extrinsic: Extr;

  blockId: number;

  timestamp: string;

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

  private static async getSignedData(hash: string): Promise<SignedExtrinsicData> {
    const [fee, feeDetails] = await Promise.all([
      nodeProvider.query((provider) => provider.api.rpc.payment.queryInfo(hash)),
      nodeProvider.query((provider) => provider.api.rpc.payment.queryFeeDetails(hash)),
    ]);

    return {
      fee: fee.toJSON(),
      feeDetails: feeDetails.toJSON(),
    };
  }

  private static async nextId(): Promise<number> {
    const result = await queryv2<{nextval: string}>('SELECT nextval(\'extrinsic_sequence\');');
    return parseInt(result[0].nextval, 10);
  }

  private static async idExists(id: number): Promise<boolean> {
    const exist = await queryv2<{id: string}>('SELECT id FROM extrinsic WHERE id = $1', [id]);
    return exist.length > 0;
  }

  private static async getId(): Promise<number> {
    let id = await Extrinsic.nextId();
    while (await Extrinsic.idExists(id)) {
      id = await Extrinsic.nextId();
    }
    return id;
  }

  async process(accountsManager: AccountManager): Promise<void> {
    this.id = await Extrinsic.getId();

    // Extracting signed data
    this.signedData = this.extrinsic.isSigned
      ? await Extrinsic.getSignedData(this.extrinsic.toHex())
      : undefined;

    this.status = extrinsicStatus(this.events);
    // Process all extrinsic events
    logger.info('Processing extrinsic events');
    await Promise.all(this.events.map(async (event) => event.process(accountsManager)));
  }

  async save(): Promise<void> {
    if (!this.id) {
      throw new Error('Extrinsic id was not claimed!');
    }
    if (!this.status) {
      throw new Error('Extrinsic status was not claimed!');
    }

    logger.info(`Insertin ${this.id} extrinsic`);
    await queryv2(`
      INSERT INTO extrinsic 
        (id, block_id, index, hash, args, docs, method, section, signer, status, error_message, type, signed_data, timestamp)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        this.id,
        this.blockId,
        this.index,
        this.extrinsic.hash.toString(),
        JSON.stringify(this.extrinsic.args),
        this.extrinsic.meta.docs.toLocaleString(),
        this.extrinsic.method.method.toString(),
        this.extrinsic.method.section.toString(),
        this.extrinsic.signer?.toString() || '0x',
        this.status.type,
        this.status.type === 'error' ? this.status.message : '',
        this.extrinsic.signer ? 'signed' : 'unsigned',
        this.signedData ? JSON.stringify(this.signedData) : null,
        this.timestamp,
      ],
    );

    const extrinsicData: ExtrinsicData = {
      id: this.id,
      index: this.index,
      status: this.status,
      signedData: this.signedData,
      args: this.extrinsic.args,
    };

    await Promise.all(this.events.map(async (event) => event.save(extrinsicData)));
  }
}

export default Extrinsic;
