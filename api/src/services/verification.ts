import { query } from "../utils/connector";
import { verifyContractArguments } from "./contract-compiler/argumentEncoder";
import { verifyContract } from "./contract-compiler/compiler";
import { checkIfContractIsERC20, extractERC20ContractData } from "./contract-compiler/erc-checkers";
import { ABI, AutomaticContractVerificationReq, ERC20Data, License, Target } from "../utils/types";
import { ensure } from "../utils/utils";

interface Bytecode {
  deployment_bytecode: string;
}

interface Status {
  status: string;
}

interface ContracVerificationInsert {
  runs: number;
  name: string;
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

interface UpdateContract {
  name: string;
  target: Target;
  source: string;
  address: string;
  license?: License;
  optimization: boolean;
  abi: ABI;
  runs: number;
  compilerVersion: string;
}

const FIND_CONTRACT_BYTECODE = `SELECT deployment_bytecode
FROM contract
WHERE contract_id = $1`;

const UPDATE_CONTRACT_STATUS = `UPDATE contract
SET verified = TRUE, name = $2, compiler_data = $3, source = $4, compiler_version = $5, optimization = $6, target = $7, runs = $8
WHERE contract_id = $1`;

const INSERT_CONTRACT_VERIFICATION = `INSERT INTO contract_verification_request
(contract_id, source, name, filename, compiler_version, arguments, optimization, runs, target, status, timestamp)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`;

const INSERT_ERC20_TOKEN = `
INSERT INTO erc20 
  (contract_id, name, symbol, decimals)
VALUES
  ($1, $2, $3, $4);`;

const CONTRACT_VERIFICATION_STATUS = `SELECT status FROM contract_verification_request WHERE id = $1`;

// Queries 
const updateContractStatus = async ({address, name, abi, source, compilerVersion, optimization, target, runs}: UpdateContract): Promise<void> => {
  await query(
    UPDATE_CONTRACT_STATUS,
    [address, name, JSON.stringify(abi), source, compilerVersion, optimization, target, runs]
  );
};

const insertErc20Token = async (address: string, {name, symbol, decimals}: ERC20Data): Promise<void> => {
  await query(INSERT_ERC20_TOKEN, [address, name, symbol, decimals]);
}

const findContractBytecode = async (address: string): Promise<string> => {
  const bytecodes = await query<Bytecode>(FIND_CONTRACT_BYTECODE, [address]);
  ensure(bytecodes.length > 0, "Contract does not exist", 404);
  return bytecodes[0].deployment_bytecode;
}

export const contractVerificationInsert = async (contract: ContracVerificationInsert): Promise<void> => {
  const timestamp = Date.now();
  await query(
    INSERT_CONTRACT_VERIFICATION,
    [
      contract.address,
      contract.source,
      contract.name,
      contract.filename,
      contract.compilerVersion,
      contract.arguments,
      contract.optimization,
      contract.runs,
      contract.target,
      contract.status,
      timestamp,
    ]
  );
};

export const verify = async (verification: AutomaticContractVerificationReq): Promise<void> => {
  const deployedBytecode = await findContractBytecode(verification.address);
  const {abi, fullAbi} = await verifyContract(deployedBytecode, verification);
  verifyContractArguments(deployedBytecode, abi, verification.arguments);
  
  if (checkIfContractIsERC20(abi)) {
    const data = await extractERC20ContractData(verification.address, abi);
    await insertErc20Token(verification.address, data);
  }

  await updateContractStatus({...verification, abi: fullAbi, optimization: verification.optimization === "true"});
  await contractVerificationInsert({...verification, status: "VERIFIED", optimization: verification.optimization === "true"})
}

export const contractVerificationStatus = async (id: string): Promise<string> => {
  const result = await query<Status>(CONTRACT_VERIFICATION_STATUS, [id]);
  ensure(result.length > 0, "Contract does not exist...", 404);
  return result[0].status;
};