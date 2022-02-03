import { query } from '../utils/connector';
import verifyContract from './contract-compiler/compiler';
import verifyContractArguments from './contract-compiler/argumentEncoder';
import {
  ABI, AutomaticContractVerificationReq, ContractType, License, Target,
} from '../utils/types';
import { ensure } from '../utils/utils';
import resolveContractData from './contract-compiler/erc-checkers';

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

interface UpdateContract {
  name: string;
  target: Target;
  source: string;
  address: string;
  license?: License;
  optimization: boolean;
  abi: {[filename: string]: ABI};
  runs: number;
  args: string;
  filename: string;
  compilerVersion: string;
  type: ContractType;
  data: string;
}

const FIND_CONTRACT_BYTECODE = 'SELECT bytecode FROM contract WHERE address = $1';

const INSERT_VERIFIED_CONTRACT = `INSERT INTO verified_contract
  (address, name, filename, source,  optimization, compiler_version, compiled_data,  args, runs, target, type, contract_data)
VALUES 
  ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
ON CONFLICT DO NOTHING;`;

const INSERT_CONTRACT_VERIFICATION = `INSERT INTO verification_request
  (address, name, filename, source, runs, optimization, compiler_version, args, target, success, message)
VALUES
  ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
ON CONFLICT DO NOTHING;`;

const CONTRACT_VERIFICATION_STATUS = 'SELECT * FROM verification_request WHERE address = $1;';

const findContractBytecode = async (address: string): Promise<string> => {
  const bytecodes = await query<Bytecode>(FIND_CONTRACT_BYTECODE, [address]);
  ensure(bytecodes.length > 0, 'Contract does not exist', 404);
  return bytecodes[0].bytecode;
};

const insertVerifiedContract = async ({
  address, name, filename, source, optimization, compilerVersion, abi, args, runs, target, type, data,
}: UpdateContract): Promise<void> => {
  await query(
    INSERT_VERIFIED_CONTRACT,
    [address.toLowerCase(), name, filename, source, optimization, compilerVersion, JSON.stringify(abi), args, runs, target, type, data],
  );
};

export const contractVerificationRequestInsert = async ({
  address, name, filename, source, runs, optimization, compilerVersion, args, target, success, errorMessage,
}: ContracVerificationInsert): Promise<void> => {
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
      errorMessage || 'null',
    ],
  );
};

export const verify = async (verification: AutomaticContractVerificationReq): Promise<void> => {
  const deployedBytecode = await findContractBytecode(verification.address.toLowerCase());
  const { abi, fullAbi } = await verifyContract(deployedBytecode, verification);
  verifyContractArguments(deployedBytecode, abi, verification.arguments);

  // Confirming verification request
  await contractVerificationRequestInsert({
    ...verification,
    success: true,
    optimization: verification.optimization === 'true',
    args: verification.arguments,
  });

  // Resolving contract additional information
  const { type, data } = await resolveContractData(verification.address, abi);

  // Inserting contract into verified contract table
  await insertVerifiedContract({
    ...verification,
    type,
    abi: fullAbi,
    data: JSON.stringify(data),
    args: verification.arguments,
    optimization: verification.optimization === 'true',
  });
};

export const contractVerificationStatus = async (id: string): Promise<boolean> => {
  const result = await query<Status>(CONTRACT_VERIFICATION_STATUS, [id.toLowerCase()]);
  return result.length > 0;
};

export const findVeririedContract = async (address: string): Promise<ContracVerificationInsert[]> => query<ContracVerificationInsert>('SELECT * FROM verified_contract WHERE address = $1', [address]);
