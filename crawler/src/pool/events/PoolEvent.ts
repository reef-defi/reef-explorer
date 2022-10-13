import { utils } from 'ethers';
import { RawEventData } from '../../crawler/types';
import { queryv2 } from '../../utils/connector';
import PoolEventBase from './PoolEventBase';

export interface PoolEventData {
  poolId: string;
  blockId: string;
  eventId: string;
  timestamp: string;
}

export interface PairEvent extends PoolEventData {
  address: string;
  rawData: RawEventData;
}

type PariEventType = 'Swap' | 'Burn' | 'Mint' | 'Sync' | 'Transfer';

class PoolEvent extends PoolEventBase<utils.LogDescription> {
  // Needed
  poolId: string;

  blockId: string;

  timestamp: string;

  type: PariEventType;

  // Optional attributes for childe classes
  to_address?: string;

  sender_address?: string;

  amount_1?: string;

  amount_2?: string;

  amount_in_1?: string;

  amount_in_2?: string;

  reserved_1?: string;

  reserved_2?: string;

  supply?: string;

  total_supply?: string;

  constructor(pairData: PoolEventData, type: PariEventType) {
    super(pairData.eventId);
    this.type = type;
    this.poolId = pairData.poolId;
    this.blockId = pairData.blockId;
    this.timestamp = pairData.timestamp;
  }

  // Available for child classes before saving
  // eslint-disable-next-line
  async process(event: utils.LogDescription): Promise<void> { }

  // Saving pool event to database
  async save(): Promise<void> {
    await queryv2(
      `INSERT INTO pool_event
        (pool_id, evm_event_id, timestamp, type, to_address, sender_address, amount_1, amount_2, amount_in_1, amount_in_2, reserved_1, reserved_2, supply, total_supply)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);`,
      [
        this.poolId,
        this.evmEventId,
        this.timestamp,
        this.type,
        this.to_address || null,
        this.sender_address || null,
        this.amount_1 || null,
        this.amount_2 || null,
        this.amount_in_1 || null,
        this.amount_in_2 || null,
        this.reserved_1 || null,
        this.reserved_2 || null,
        this.supply || null,
        this.total_supply || null,
      ],
    );
  }

  async combine(event: utils.LogDescription): Promise<void> {
    await this.process(event);
    await this.save();
  }
}

export default PoolEvent;
