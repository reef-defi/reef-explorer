import { query } from "./connector";
import { License, Pool, StakingReward, Target, Token } from "./types";
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

const INSERT_CONTRACT_VERIFICATION = `INSERT INTO contract_verification_request
(contract_id, source, filename, compiler_version, optimization, runs, target, license, status, timestamp)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`;

export const contractVerificationInsert = async (contract: ContracVerificationInsert): Promise<void> => {
  const timestamp = Date.now();
  await query(
    INSERT_CONTRACT_VERIFICATION,
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

const FIND_VERIFIED_CONTRACT = `SELECT * FROM contract_verification_req WHERE processed_bytecode = $1`;
export const checkIfContractIsVerified = async (bytecode: string): Promise<boolean> => {
  const result = await query(FIND_VERIFIED_CONTRACT, [bytecode]);
  return result.length > 0;
}

interface Status {
  status: string;
}
const CONTRACT_VERIFICATION_STATUS = `SELECT status FROM contract_verification_request WHERE id = $1`;
export const contractVerificationStatus = async (id: string): Promise<string> => {
  const result = await query<Status>(CONTRACT_VERIFICATION_STATUS, [id]);
  ensure(result.length > 0, "Contract does not exist...");
  return result[0].status;
}

const UPDATE_CONTRACT_STATUS = `UPDATE contract SET verified = $1 WHERE contract_id = $2`;
export const updateContractStatus = async (address: string, status: string): Promise<void> => {
  await query(UPDATE_CONTRACT_STATUS, [status, address]);
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

const UPDATE_CONTRACTS_VERIFICATION_STATUS = `UPDATE contract SET verified = 'VERIFIED' WHERE processed_bytecode = $1`;
export const updateContractsVerificationStatus = async (bytecode: string): Promise<void> => {
  await query(UPDATE_CONTRACTS_VERIFICATION_STATUS, [bytecode]);
}

interface Balance {
  balance: number;
}
const FIND_USER_BALANCE = `SELECT balance FROM token_holder WHERE (holder_account_id = $1 OR holder_evm_address = $1) AND contract_id = $2`;
const REEF_CONTRACT = '0x0000000000000000000000000000000001000000';
export const userBalance = async (address: string): Promise<number> => 
  query<Balance>(FIND_USER_BALANCE, [address, REEF_CONTRACT])[0]; // TODO maybe this wont work!

const FIND_TOKEN = `SELECT name, icon_url, decimals FROM contract WHERE contract_id = $1`;
export const findToken = async (tokenAddress: string): Promise<Token> => {
  const res = await query<Token>(FIND_TOKEN, [tokenAddress]);
  ensure(res.length > 0, 'Token does not exist');
  return res[0];
}

const FIND_USER_TOKEN = `SELECT
  c.name,
  c.icon_url,
  c.decimals,
  balance
FROM
  token_holder AS th,
  contract AS c
WHERE
  th.contract_id = $1 AND
  th.contract_id = c.contract_id AND
  (th.holder_account_id = $2 OR th.holder_evm_address = $2)`;
export const findUsersToken = async (userAddress: string, tokenAddress: string): Promise<Token> => {
  const tokens = await query<Token>(FIND_USER_TOKEN, [tokenAddress, userAddress]);
  ensure(tokens.length > 0, "User does not have desired token");
  return tokens[0];
}

const FIND_USER_POOL_BALANCE = 'SELECT balance FROM pool_user WHERE pool_address = $1 AND user_address = $2';
const findUserPoolBalance = async (poolAddress: string, userAddress: string): Promise<Balance> => {
  const balance = await query<Balance>(FIND_USER_POOL_BALANCE, [poolAddress, userAddress]);
  ensure(balance.length > 0, "User is not in pool");
  return balance[0];
}

interface PoolDB {
  address: string;
  decimals: number;
  reserve1: string;
  reserve2: string;
  total_supply: string;
  minimum_liquidity: string;  // TODO change this to liquidity
}
const FIND_POOL = `
SELECT 
  address, 
  decimals, 
  reserve1,
  reserve2,
  total_supply,
  minimum_liquidity 
FROM pool
WHERE token1 = $1 AND token2 = $2`;
const findPool = async (tokenAddress1: string, tokenAddress2: string): Promise<Pool> => {
  const pools = await query<PoolDB>(FIND_POOL, [tokenAddress1, tokenAddress2]);
  ensure(pools.length > 0, 'Pool does not exist');
  const token1 = await findToken(tokenAddress1);
  const token2 = await findToken(tokenAddress2);

  return {
    token1,
    token2,
    decimals: pools[0].decimals,
    minimumLiquidity: pools[0].minimum_liquidity,
    reserve1: pools[0].reserve1,
    reserve2: pools[0].reserve2,
    poolAddress: pools[0].address,
    totalSupply: pools[0].total_supply,
    userPoolBalance: "0",
  }
}

const FIND_USER_POOL = `
SELECT 
  address, 
  decimals, 
  reserve1,
  reserve2,
  total_supply,
  minimum_liquidity 
FROM 
  pool as p,
  pool_user as pu
WHERE
  p.token1 = $1 AND 
  p.token2 = $2 AND
  pu.user_address = $3 AND
  p.pool_address = pu.pool_address`;