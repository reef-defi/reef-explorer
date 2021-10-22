import { query } from "./connector";
import { License, Target } from "./types";
import { ensure } from "./utils";

interface ContracVerificationInsert {
  runs: number;
  source: string;
  status: string;
  target: Target;
  address: string;
  filename: string;
  license: License;
  optimization: boolean;
  compilerVersion: string;
}

const INSERT_CONTRACT_VERIFICATION_STATEMENT = `INSERT INTO contract_verification_request
(contract_id, source, filename, compiler_version, optimization, runs, target, license, status, timestamp)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`;

export const contractVerificationInsert = async (contract: ContracVerificationInsert): Promise<void> => {
  const timestamp = Date.now();
  await query(
    INSERT_CONTRACT_VERIFICATION_STATEMENT,
    [
      contract.address,
      contract.source,
      contract.filename,
      contract.compilerVersion,
      contract.optimization,
      contract.runs,
      contract.target,
      contract.license,
      contract.status,
      timestamp,
    ]
  );
};

const FIND_VERIFIED_CONTRACT_STATEMENT = `SELECT * FROM contract_verification_req WHERE processed_bytecode = $1`;
export const checkIfContractIsVerified = async (bytecode: string): Promise<boolean> => {
  const result = await query(FIND_VERIFIED_CONTRACT_STATEMENT, [bytecode]);
  return result.length > 0;
}

interface Status {
  status: string;
}
const CONTRACT_VERIFICATION_STATUS_STATEMENT = `SELECT status FROM contract_verification_request WHERE id = $1`;
export const contractVerificationStatus = async (id: string): Promise<string> => {
  const result = await query<Status>(CONTRACT_VERIFICATION_STATUS_STATEMENT, [id]);
  ensure(result.length > 0, "Contract does not exist...");
  return result[0].status;
}

const UPDATE_CONTRACT_STATUS_STATEMENT = `UPDATE contract SET verified = $1 WHERE contract_id = $2`;
export const updateContractStatus = async (address: string, status: string): Promise<void> => {
  await query(UPDATE_CONTRACT_STATUS_STATEMENT, [status, address]);
};

// TODO maybe some types will need to be changed if for some reason code crashes
interface UserToken {
  contract_id: string;
  holder_account_id: string;
  holder_evm_address: string;
  balance: string;
  token_decimals: string;
  token_symbol: string;
}
// TODO does this work?
const FIND_USER_TOKENS = `SELECT
  th.contract_id,
  holder_account_id,
  holder_evm_address,
  balance,
  token_decimals,
  token_symbol
FROM
  token_holder AS th,
  contract AS c
WHERE
  (holder_account_id = $1 OR holder_evm_address = $1)
  AND th.contract_id = c.contract_id`;
export const findUserTokens = async (address: string): Promise<UserToken[]> =>
  query<UserToken>(FIND_USER_TOKENS, [address]);


interface StakingReward {
  data: string;
  phase: string;
  method: string;
  section: string;
  timestamp: string;
  event_index: number;
  block_number: number;
}
const FIND_STAKING_REWARDS = `SELECT
  block_number,
  data,
  event_index,
  method,
  phase,
  section,
  timestamp
FROM event
WHERE section = 'staking' AND method = 'Reward'`;
export const findStakingRewards = async (): Promise<StakingReward[]> => 
  query<StakingReward>(FIND_STAKING_REWARDS, []);

const UPDATE_CONTRACTS_VERIFICATION_STATUS_STATEMENT = `UPDATE contract SET verified = 'VERIFIED' WHERE processed_bytecode = $1`;
export const updateContractsVerificationStatus = async (bytecode: string): Promise<void> => {
  await query(UPDATE_CONTRACTS_VERIFICATION_STATUS_STATEMENT, [bytecode]);
}