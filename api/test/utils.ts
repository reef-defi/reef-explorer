import { verifyContractArguments } from "../src/services/contract-compiler/argumentEncoder";
import { verifyContract } from "../src/services/contract-compiler/compiler";
import { ABI } from "../src/utils/types";

export interface ContractStorage {
  abi: ABI,
  name: string;
  sources: string;
  bytecode: string;
  filename: string;
  arguments: string;
}


export const argumentTester = ({bytecode, abi, arguments: args}: ContractStorage): boolean => {
  try {
    verifyContractArguments(bytecode, abi, args);
    return true;
  } catch (err) {
    return false;
  }
}

export const argumentCustomTester = (contract: ContractStorage, args: any[]): boolean => 
  argumentTester({...contract, arguments: JSON.stringify(args)})

export const argumentErrorTester = (bytecode: string, abi: ABI, args: string): string => {
  try {
    verifyContractArguments(bytecode, abi, `[\"${args}\"]`)
    return "";
  } catch (err) {
    console.log(err);
    return err.message
  }
}

export const sourceTester = async ({name, filename, sources, bytecode}: ContractStorage): Promise<boolean> => {
  try {
    await verifyContract(bytecode, {
      name,
      filename,
      source: sources,
      compilerVersion: "v0.8.4+commit.c7e474f2",
      target: "london",
      optimization: "true",
      runs: 200,

      address: "",
      arguments: "",
      bytecode: "",
      license: "unlicense"
    });
    return true;
  } catch (err) {
    return false;
  }
}
