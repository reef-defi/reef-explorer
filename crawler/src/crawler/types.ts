import { AnyTuple } from '@polkadot/types/types';
import { GenericExtrinsic } from '@polkadot/types/extrinsic';
import { FrameSystemEventRecord } from '@polkadot/types/lookup';
import { JsonFragment } from '@ethersproject/abi';
import type { BlockHash as BH } from '@polkadot/types/interfaces/chain';
import type { SignedBlock } from '@polkadot/types/interfaces/runtime';
import type { HeaderExtended } from '@polkadot/api-derive/type/types';
import { Vec } from '@polkadot/types';
import { utils } from 'ethers';

export interface BlockHash {
  id: number;
  hash: BH;
}

export type Extrinsic = GenericExtrinsic<AnyTuple>;
export type Event = FrameSystemEventRecord;

export interface BlockBody extends BlockHash {
  signedBlock: SignedBlock;
  extendedHeader?: HeaderExtended;
  events: Vec<Event>;
  timestamp: string;
}

interface ExtrinsicUnknown {
  type: 'unknown';
}
interface ExtrinsicSuccess {
  type: 'success';
}
interface ExtrinsicError {
  type: 'error';
  message: string;
}

export interface DecodedEvmError {
  address: string;
  message: string;
}

export type ExtrinsicStatus =
  | ExtrinsicError
  | ExtrinsicSuccess
  | ExtrinsicUnknown;

export interface ExtrinsicHead {
  index: number;
  events: Event[];
  blockId: number;
  timestamp: string;
  extrinsic: Extrinsic;
  status: ExtrinsicStatus;
}

export interface SignedExtrinsicData {
  fee: any;
  feeDetails: any;
}
export interface ExtrinsicBody extends ExtrinsicHead {
  id: number;
  signedData?: SignedExtrinsicData;
  index: number;
}

export interface EventHead {
  event: Event;
  blockId: number;
  timestamp: string;
  extrinsicId: number;
  index: number;
  extrinsicIndex: number;
}
export interface EventBody extends EventHead {
  id: number;
}

export interface AccountHead {
  address: string;
  blockId: number;
  active: boolean;
  timestamp: string;
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

export interface Contract {
  address: string;
  extrinsicId: number;
  signer: string;

  bytecode: string;
  bytecodeContext: string;
  bytecodeArguments: string;

  gasLimit: string;
  storageLimit: string;

  timestamp: string;
}

export interface EVMCall {
  data: string;
  blockId: number;
  account: string;
  gasLimit: string;
  timestamp: string;
  extrinsicId: number;
  storageLimit: string;
  contractAddress: string;
  status: ExtrinsicStatus;
}

export interface EVMEventData {
  data: any;
  section: string;
  method: string;
  timestamp: string;
  id: number;
  blockId: number;
  extrinsicIndex: number;
  eventIndex: number;
}

export type ABI = JsonFragment[];

export interface ABIS {
  [name: string]: ABI;
}

export interface ERC721Data {
  name: string;
  symbol: string;
}
export interface ERC20Data extends ERC721Data {
  decimals: number;
}

export type TokenType = 'ERC20' | 'ERC721' | 'ERC1155';
type VerifiedContractType = 'other' | TokenType;
type VerifiedContractData = null | ERC20Data | ERC721Data;

export interface VerifiedContract {
  name: string;
  address: string;
  compiled_data: ABIS;
  type: VerifiedContractType;
  contract_data: VerifiedContractData;
}

export interface ERC20Token extends VerifiedContract {
  type: 'ERC721';
  contract_data: ERC721Data;
}
export interface ERC721Token extends VerifiedContract {
  type: 'ERC20';
  contract_data: ERC721Data;
}

export interface BytecodeLog {
  data: string;
  address: string;
  topics: string[];
}

export interface BytecodeLogWithBlockId extends BytecodeLog {
  blockId: number;
  timestamp: string;
  extrinsicId: number;
  signedData: SignedExtrinsicData;
}

export interface EvmLog extends BytecodeLogWithBlockId {
  abis: ABIS;
  name: string;
  type: VerifiedContractType;
  contractData: VerifiedContractData;
}

export interface EvmLogWithDecodedEvent extends EvmLog {
  decodedEvent: utils.LogDescription;
}

type TokenHolderType = 'Contract' | 'Account';
type TokenHolderInfo = null | ERC20Data | ERC721Data;
type TokenHolderNftId = null | string;

export interface NativeTokenHolderHead {
  timestamp: string;
  tokenAddress: string;
  info: TokenHolderInfo;
  signerAddress: string;
}

export interface TokenBalanceHead extends NativeTokenHolderHead {
  abi: ABI;
}

interface TokenHolderBase {
  timestamp: string;
  evmAddress: string;
  tokenAddress: string;
  info: TokenHolderInfo;
  nftId: TokenHolderNftId;
}

export interface TokenHolderHead extends TokenHolderBase {
  abi: ABI,
  type: TokenType
}

export interface TokenHolder extends TokenHolderBase {
  balance: string;
  type: TokenHolderType;
  signerAddress: string;
}
