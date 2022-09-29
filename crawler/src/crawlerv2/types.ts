import { FrameSystemEventRecord } from '@polkadot/types/lookup';
import type { AnyTuple } from '@polkadot/types/types';
import { ExtrinsicStatus, RawEventData, SignedExtrinsicData } from '../crawler/types';

// export interface ProcessModule {
//   process(accountsManager: AccountManager): Promise<void>;
//   save(): Promise<void>;
// }
export type Event = FrameSystemEventRecord;

export interface ExtrinsicData {
  id: number;
  index: number;
  status: ExtrinsicStatus;
  signedData?: SignedExtrinsicData;
  args: AnyTuple;
}

export interface EventData {
  event: Event;
  index: number;
  blockId: number;
  timestamp: string;
}

export interface CompleteEvmData {
  raw: RawEventData;
  parsed?: any;
}

export type TransferType = 'Native' | 'ERC20' | 'ERC721' | 'ERC1155';

export interface Transfer {
  blockId: number;
  eventId: number;

  denom?: string;
  nftId?: string;

  amount: string;
  type: TransferType;

  toAddress: string;
  fromAddress: string;
  tokenAddress: string;
  fromEvmAddress: string;
  toEvmAddress: string;

  timestamp: string;
}
