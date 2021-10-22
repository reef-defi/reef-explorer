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