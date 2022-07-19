import { Extrinsic, ExtrinsicStatus, SignedExtrinsicData } from "../crawler/types";
import AccountManager from "./managers/AccountManager";

import { FrameSystemEventRecord } from '@polkadot/types/lookup';

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
}

export interface EventData {
  event: Event;
  index: number;
  blockId: number;
  timestamp: string;
}

export interface Transfer {
  blockId: number;

  denom?: string;
  nftId?: string;

  amount: string;
  feeAmount: string;
  type: 'Native' | 'ERC20' | 'ERC721' | 'ERC1155';

  toAddress: string;
  fromAddress: string;
  tokenAddress: string;
  fromEvmAddress: string;
  toEvmAddress: string;

  success: boolean;
  errorMessage: string;

  timestamp: string;
}