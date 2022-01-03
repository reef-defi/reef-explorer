import { AnyTuple } from "@polkadot/types/types";
import { GenericExtrinsic } from "@polkadot/types/extrinsic";
import { FrameSystemEventRecord } from "@polkadot/types/lookup";
import { JsonFragment } from "@ethersproject/abi";
import type { BlockHash as BH } from "@polkadot/types/interfaces/chain";
import type { SignedBlock } from "@polkadot/types/interfaces/runtime";
import type { HeaderExtended } from "@polkadot/api-derive/type/types";
import { Vec } from "@polkadot/types";

export interface BlockHash {
  id: number;
  hash: BH;
}

export interface BlockBody extends BlockHash {
  signedBlock: SignedBlock;
  extendedHeader?: HeaderExtended;
  events: Vec<Event>;
  timestamp: number;
}


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

export type ExtrinsicStatus =
  | ExtrinsicError
  | ExtrinsicSuccess
  | ExtrinsicUnknown;

export interface ExtrinsicHead {
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

export interface EventHead {
  event: Event;
  blockId: number;
  extrinsicId: number;
  index: number;
}
export interface EventBody extends EventHead {
  id: number;
}

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
  evmNonce: string | null;
}

export interface Transfer {
  blockId: number;
  extrinsicId: number;

  denom: string;
  toAddress: string;
  fromAddress: string;
  tokenAddress: string;
  amount: string;
  feeAmount: string;

  success: boolean;
  errorMessage: string;
}

export interface Contract {
  address: string;
  extrinsicId: number;
  signer: string;

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

export interface AccountTokenHead {
  accountEvmAddress: string;
  contractAddress: string;
  // accountEvmAddress: string;
}

export interface AccountTokenBalance extends AccountTokenHead {
  balance: string;
  decimals: number;
  signer: string;
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
  [name: string]: ABI;
}
