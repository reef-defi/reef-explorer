import {AnyTuple} from "@polkadot/types/types"
import {GenericExtrinsic} from "@polkadot/types/extrinsic"
import {FrameSystemEventRecord} from "@polkadot/types/lookup"

export type Extrinsic = GenericExtrinsic<AnyTuple>;
export type Event = FrameSystemEventRecord;

export interface ExtrinsicHead {
  id: number;
  blockId: number;
  extrinsic: Extrinsic;
  events: Event[];
}

export interface SignedExtrinsicData {
  // TODO set tipes
  fee: any;
  feeDetails: any;
}
export interface ExtrinsicBody extends ExtrinsicHead {
  signedData?: SignedExtrinsicData;
}

export interface EventHead {
  id: number;
  event: Event;
  blockId: number;
  extrinsicId: number;
}

interface ExtrinsicUnknown {
  type: "unknown";
}
interface ExtrinsicSuccess {
  type: "success";
}
interface ExtrinsicError {
  type: "error";
  message: string;
}

export type ExtrinsicStatus = ExtrinsicError | ExtrinsicSuccess | ExtrinsicUnknown;


export interface AccountHead {
  address: string;
  blockId: number;
  active: boolean;
}
export interface AccountBody extends AccountHead {
  evmAddress: string;
}