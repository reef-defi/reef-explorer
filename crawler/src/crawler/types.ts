import {AnyTuple} from "@polkadot/types/types"
import {GenericExtrinsic} from "@polkadot/types/extrinsic"
import {FrameSystemEventRecord} from "@polkadot/types/lookup"
import { JsonFragment } from "@ethersproject/abi";

export type Extrinsic = GenericExtrinsic<AnyTuple>;
export type Event = FrameSystemEventRecord;

export interface ExtrinsicHead {
  blockId: number;
  extrinsic: Extrinsic;
  events: Event[];
  status: ExtrinsicStatus;
}
export interface ExtrinsicHeadV2 {
  id: number;
  blockId: number;
  extrinsic: Extrinsic;
  events: Event[];
  status: ExtrinsicStatus;
}

export interface SignedExtrinsicData {
  // TODO set tipes
  fee: any;
  feeDetails: any;
}
export interface ExtrinsicBody extends ExtrinsicHead {
  id: number;
  signedData?: SignedExtrinsicData;
}
export interface ExtrinsicBodyPromise extends ExtrinsicHead {
  id: number;
  signedData?: Promise<SignedExtrinsicData>;
}

export interface EventHead {
  event: Event;
  blockId: number;
  extrinsicId: number;
  index: number;
}
export interface EventBody extends EventHead {
  id: number;
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
  identity: string;
  evmAddress: string;
  freeBalance: string;
  lockedBalance: string;
  availableBalance: string;
  vestedBalance: string;
  votingBalance: string;
  reservedBalance: string;
  nonce: string;
  evmNonce: string|null;
}

export interface Transfer {
  blockId: number;
  extrinsicId: number;

  denom: string;
  toAddress: string;
  fromAddress: string;
  amount: string;
  feeAmount: string;

  success: boolean;
  errorMessage: string;
}

export interface OldContract {
  blockId: number;
  extrinsic: Extrinsic;
  extrinsicId: number;
  extrinsicEvents: Event[];
  status: ExtrinsicStatus;
}

export interface Contract {
  address: string;
  extrinsicId: number;

  bytecode: string;
  bytecodeContext: string;
  bytecodeArguments: string;

  gasLimit: string;
  storageLimit: string;
}

export interface EVMCall {
  data: string;
  account: string;
  gasLimit: string;
  extrinsicId: number;
  storageLimit: string;
  contractAddress: string;
  status: ExtrinsicStatus;
}

export interface ResolveSection {
  blockId: number;
  extrinsicId: number;
  extrinsic: Extrinsic;
  status: ExtrinsicStatus;
  extrinsicEvents: Event[];
  signedData: SignedExtrinsicData;
}

export interface AccountTokenHead {
  accountAddress: string;
  contractAddress: string;
  // accountEvmAddress: string;
}

export interface AccountTokenBalance extends AccountTokenHead {
  balance: string;
  decimals: number;
}


export interface ERC20Token {
  name: string;
  address: string;
  compiled_data: ABIS;
  contract_data: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export type ABI = JsonFragment[];

export interface ABIS {
  [name: string]: ABI
}