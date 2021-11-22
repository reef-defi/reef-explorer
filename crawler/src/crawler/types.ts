import {AnyTuple} from "@polkadot/types/types"
import {GenericExtrinsic} from "@polkadot/types/extrinsic"
import {FrameSystemEventRecord} from "@polkadot/types/lookup"

export type Extrinsic = GenericExtrinsic<AnyTuple>;
export type Event = FrameSystemEventRecord;


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
