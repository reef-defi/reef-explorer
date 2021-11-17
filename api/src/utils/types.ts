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
  | "none"
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
  minimum_liquidity: string;  // TODO change to liquidity!
}

export interface Pool extends DefaultPool {
  totalSupply: string;
  userPoolBalance: string;
  minimumLiquidity: string;
}

export interface ERC20Data {
  name: string;
  symbol: string;
  decimals: number;
}
