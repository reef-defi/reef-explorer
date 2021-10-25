import { Request } from "express";

export interface AppRequest <T> extends Request {
  body: T
};

export type Target = 
  | "default"
  | "homestead"
  | "tangerineWhistle"
  | "spuriousDragon"
  | "byzantium"
  | "constantinople"
  | "petersburg"
  | "istanbul";

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


export interface ContractVerificationID {
  id: string;
}

export interface AutomaticContractVerificationReq {
  abi: string;
  args: string;
  runs: number;
  source: string;
  target: Target;
  address: string;
  bytecode: string;
  filename: string;
  license: License;
  optimization: boolean;
  compilerVersion: string;
}

export interface ManualContractVerificationReq extends AutomaticContractVerificationReq {
  token: string;
}

export interface AccountAddress {
  address: string;
}

export interface Token {
  name: string;
  address: string;
  iconUrl: string;
  userBalance: string;
  decimals: number;
}

interface BasicPool {
  decimals: number
  reserve1: string;
  reserve2: string;
  totalSupply: string;
  poolAddress: string;
  minimumLiquidity: string;
  userPoolBalance: string;
}

export interface Pool extends BasicPool {
  token1: Token;
  token2: Token;
}

export interface StakingReward {
  data: string;
  phase: string;
  method: string;
  section: string;
  timestamp: string;
  event_index: number;
  block_number: number;
}