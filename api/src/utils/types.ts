import { Request } from 'express';
import {
  Fragment,
  JsonFragment,
  FunctionFragment,
  EventFragment,
  ConstructorFragment,
} from '@ethersproject/abi';

export interface AppRequest<T> extends Request {
  body: T;
}

export interface ERC721Data {
  name: string;
  symbol: string;
}

export interface ERC20Data extends ERC721Data {
  decimals: number;
}

interface VerifiedERC20 {
  type: 'ERC20';
  data: ERC20Data;
}
interface VerifiedERC721 {
  type: 'ERC721';
  data: ERC721Data;
}
interface VerifiedERC1155 {
  type: 'ERC1155';
  data: {};
}
interface VerifiedOther {
  type: 'other';
  data: {};
}

export type ContractType = 'other' | 'ERC20' | 'ERC721' | 'ERC1155';
export type ContractResolve =
  | VerifiedERC20
  | VerifiedERC721
  | VerifiedERC1155
  | VerifiedOther;

// Basic types
export type Target =
  | 'london'
  | 'berlin'
  | 'istanbul'
  | 'petersburg'
  | 'constantinople'
  | 'byzantium'
  | 'spuriousDragon'
  | 'homestead'
  | 'tangerineWhistle';

export type License =
  | 'none'
  | 'unlicense'
  | 'MIT'
  | 'GNU GPLv2'
  | 'GNU GPLv3'
  | 'GNU LGPLv2.1'
  | 'GNU LGPLv3'
  | 'BSD-2-Clause'
  | 'BSD-3-Clause'
  | 'MPL-2.0'
  | 'OSL-3.0'
  | 'Apache-2.0'
  | 'GNU AGPLv3';

export const compilerTargets: Target[] = [
  'berlin',
  'byzantium',
  'constantinople',
  'homestead',
  'istanbul',
  'london',
  'petersburg',
  'spuriousDragon',
  'tangerineWhistle',
];
export type ABIFragment =
  | Fragment
  | JsonFragment
  | FunctionFragment
  | EventFragment
  | ConstructorFragment;
export type ABI = ReadonlyArray<ABIFragment>;
export type Argument = string | boolean | Argument[];
export type Arguments = any[]; // Argument[];
export type Source = { [filename: string]: string };

// Request types
export interface AutomaticContractVerificationReq {
  name: string;
  runs: number;
  source: string;
  target: Target;
  address: string;
  filename: string;
  license: License;
  arguments: string; // Arguments;
  optimization: string;
  compilerVersion: string;
}
export type AutomaticContractVerificationKey =
  keyof AutomaticContractVerificationReq;

export interface ManualContractVerificationReq
  extends AutomaticContractVerificationReq {
  token: string;
}
export interface PoolReq {
  tokenAddress1: string;
  tokenAddress2: string;
}

export interface TokenBalanceParam {
  accountAddress: string;
  contractAddress: string;
}
// interface DefaultToken {
//   name: string;
//   address: string;
//   balance: string;
//   decimals: number;
// }

// export interface Token extends DefaultToken {
//   iconUrl: string;
// }
// export interface TokenDB extends DefaultToken {
//   icon_url: string;
// }

interface DefaultPool {
  address: string;
  decimals: number;
  reserve1: string;
  reserve2: string;
}

export interface PoolDB extends DefaultPool {
  balance: string;
  total_supply: string;
  minimum_liquidity: string; // TODO change to liquidity!
}

export interface Pool extends DefaultPool {
  totalSupply: string;
  userPoolBalance: string;
  minimumLiquidity: string;
}

export interface User {
  address: string;
  evmaddress: string;
  freebalance: string;
  lockedbalance: string;
  availablebalance: string;
}
export interface UserTokenBalance extends User {
  tokenAddress: string;
  balance: string;
  decimals: number;
}
