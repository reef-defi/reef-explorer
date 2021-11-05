import { ABI } from "../src/types";

export interface ContractStorage {
  abi: ABI,
  name: string;
  sources: string;
  bytecode: string;
  filename: string;
  arguments: string;
}