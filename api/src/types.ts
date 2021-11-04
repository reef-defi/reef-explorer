import { Request } from "express";
import { Fragment, JsonFragment } from "@ethersproject/abi";

export interface AppRequest <T> extends Request {
  body: T
};

// Basic types
export type Target = 
  | "london"
  | "berlin"
  | "istanbul"
  | "petersburg"
  | "constantinople"
  | "byzantium"
  | "spuriousDragon"
  | "homestead"
  | "tangerineWhistle";

export type License = 
  | "unlicense"
  | "MIT"
  | "GNU GPLv2"
  | "GNU GPLv3"
  | "GNU LGPLv2.1"
  | "GNU LGPLv3"
  | "BSD-2-Clause"
  | "BSD-3-Clause"
  | "MPL-2.0"
  | "OSL-3.0"
  | "Apache-2.0"
  | "GNU AGPLv3";

export interface Bytecode {
  deployment_bytecode: string;
}
export interface Status {
  status: string;
}
export interface AccountAddress {
  address: string;
}
export interface ContractVerificationID {
  id: string;
}

export interface ParamererInput {
  type: string;
  value: string;
  name?: string;
}
export interface Parameters {
  type: string;
  funcName: string;
  inputs: ParamererInput[];
};
export type ABIFragment = Fragment | JsonFragment;
export type ABI = ReadonlyArray<ABIFragment>;
// Request types
export interface AutomaticContractVerificationReq {
  name: string;
  runs: number;
  source: string;
  target: Target;
  address: string;
  bytecode: string;
  filename: string;
  license: License;
  arguments: string;
  optimization: string;
  compilerVersion: string;
}

export interface ManualContractVerificationReq extends AutomaticContractVerificationReq {
  token: string;
}
export interface PoolReq {
  tokenAddress1: string;
  tokenAddress2: string;
}

export interface UserPoolReq extends PoolReq {
  userAddress: string;
}

interface DefaultToken {
  name: string;
  address: string;
  balance: string;
  decimals: number;
}

export interface Token extends DefaultToken {
  iconUrl: string;
}
export interface TokenDB extends DefaultToken {
  icon_url: string;
}

interface TokenInfoDefault {
  abi: string; 
  name: string;
  runs: number;
  signer: string;
  source: string;
  target: Target;
  bytecode: string;
  license: License;
  verified: string;
  optimization: boolean;
}

export interface TokenInfo extends TokenInfoDefault {
  compilerVersion: string;
}
export interface TokenInfoDB extends TokenInfoDefault {
  compiler_version: string;
}

interface DefaultPool {
  address: string;
  decimals: number;
  reserve1: string;
  reserve2: string;
}

export interface PoolDB extends DefaultPool {
  balance: string;
  total_supply: string;
  minimum_liquidity: string;  // TODO change to liquidity!
}

export interface Pool extends DefaultPool {
  totalSupply: string;
  userPoolBalance: string;
  minimumLiquidity: string;
}

export interface ContracVerificationInsert {
  runs: number;
  source: string;
  status: string;
  target: Target;
  address: string;
  filename: string;
  license: License;
  arguments: string;
  optimization: boolean;
  compilerVersion: string;
}


// TODO maybe some types will need to be changed if for some reason code crashes
export interface UserTokenDB {
  contract_id: string;
  holder_account_id: string;
  holder_evm_address: string;
  balance: string;
  token_decimals: string;
  token_symbol: string;
}

export interface StakingRewardDB {
  data: string;
  phase: string;
  method: string;
  section: string;
  timestamp: string;
  event_index: number;
  block_number: number;
}

