import { query } from "../utils/connector";
import { verifyContractArguments } from "./contract-compiler/argumentEncoder";
import { verifyContract } from "./contract-compiler/compiler";
import { checkIfContractIsERC20, extractERC20ContractData } from "./contract-compiler/erc-checkers";
import { ABI, AutomaticContractVerificationReq, ERC20Data, License, Target } from "../utils/types";
import { ensure } from "../utils/utils";

interface Bytecode {
  bytecode: string;
}

interface Status {
  status: string;
}

interface ContracVerificationInsert {
  address: string;
  name: string;
  filename: string;
  source: string;
  runs: number,
  optimization: boolean;
  compilerVersion: string;
  args: string;
  target: string;
  success: boolean;
  errorMessage?: string;
}

type ContractType = "other" | "ERC20" | "ERC721";
interface UpdateContract {
  name: string;
  target: Target;
  source: string;
  address: string;
  license?: License;
  optimization: boolean;
  abi: ABI;
  runs: number;
  args: string;
  filename: string;
  compilerVersion: string;
  type: ContractType;
  data: string;
}

const FIND_CONTRACT_BYTECODE = `SELECT bytecode FROM contract WHERE address = $1`;

const UPDATE_CONTRACT_STATUS = `UPDATE contract
SET verified = TRUE, name = $2, compiler_data = $3, source = $4, compiler_version = $5, optimization = $6, target = $7, runs = $8
WHERE address = $1`;

const INSERT_VERIFIED_CONTRACT = `INSERT INTO verified_contract
(address, name, filename, source,  optimization, compiler_version, compiled_data,  args, runs, target)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`

const INSERT_CONTRACT_VERIFICATION = `INSERT INTO verification_request
(address, name, filename, source, runs, optimization, compiler_version, args, target, success, message)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`;

const INSERT_ERC20_TOKEN = `
INSERT INTO erc20 
  (contract_id, name, symbol, decimals)
VALUES
  ($1, $2, $3, $4);`;

const CONTRACT_VERIFICATION_STATUS = `SELECT status FROM verification_request WHERE id = $1`;

// Queries 
// const updateContractStatus = async ({address, name, abi, source, compilerVersion, optimization, target, runs}: UpdateContract): Promise<void> => {
//   await query(
//     UPDATE_CONTRACT_STATUS,
//     [address, name, JSON.stringify(abi), source, compilerVersion, optimization, target, runs]
//   );
// };

const insertErc20Token = async (address: string, {name, symbol, decimals}: ERC20Data): Promise<void> => {
  await query(INSERT_ERC20_TOKEN, [address, name, symbol, decimals]);
}

const findContractBytecode = async (address: string): Promise<string> => {
  const bytecodes = await query<Bytecode>(FIND_CONTRACT_BYTECODE, [address]);
  ensure(bytecodes.length > 0, "Contract does not exist", 404);
  return bytecodes[0].bytecode;
}


const insertVerifiedContract = async ({address, name, filename, source, optimization, compilerVersion, abi, args, runs, target}: UpdateContract): Promise<void> => {
  await query(
    INSERT_VERIFIED_CONTRACT, 
    [address.toLowerCase(), name, filename, source, optimization, compilerVersion, JSON.stringify(abi), args, runs, target]
  )
}

export const contractVerificationInsert = async ({address, name, filename, source, runs, optimization, compilerVersion, args, target, success, errorMessage}: ContracVerificationInsert): Promise<void> => {
  await query(
    INSERT_CONTRACT_VERIFICATION,
    [
      address.toLowerCase(),
      name,
      filename,
      source,
      runs,
      optimization,
      compilerVersion,
      args,
      target,
      success,
      errorMessage ? errorMessage : "null"
    ]
  );
};

export const verify = async (verification: AutomaticContractVerificationReq): Promise<void> => {
  const deployedBytecode = await findContractBytecode(verification.address.toLowerCase());
  const {abi, fullAbi} = await verifyContract(deployedBytecode, verification);
  verifyContractArguments(deployedBytecode, abi, verification.arguments);
  let type: ContractType = "other";
  let data: ERC20Data | undefined;
  if (checkIfContractIsERC20(abi)) {
    data = await extractERC20ContractData(verification.address, abi);
    type = "ERC20";
    // await insertErc20Token(verification.address, data);
  }
  console.log(verification.source)
  console.log(verification.arguments)
  console.log(fullAbi)
  await insertVerifiedContract({...verification, abi: fullAbi, optimization: verification.optimization === "true", args: verification.arguments, type, data: data ? JSON.stringify(data) : "null"});
  // await updateContractStatus({...verification, abi: fullAbi, optimization: verification.optimization === "true"});
  await contractVerificationInsert({...verification, success: true, optimization: verification.optimization === "true", args: verification.arguments})
}

export const contractVerificationStatus = async (id: string): Promise<string> => {
  const result = await query<Status>(CONTRACT_VERIFICATION_STATUS, [id]);
  ensure(result.length > 0, "Contract does not exist...", 404);
  return result[0].status;
};
