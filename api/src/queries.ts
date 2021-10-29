
import { query } from "./connector";
import { Bytecode, ContracVerificationInsert, Pool, PoolDB, StakingRewardDB, Status, Token, TokenDB, UserTokenDB } from "./types";
import { ensure } from "./utils";
import crypto from "crypto";

const INSERT_CONTRACT_VERIFICATION = `INSERT INTO contract_verification_request
(id, contract_id, source, filename, compiler_version, arguments, optimization, runs, target, license, status, timestamp)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`;

export const contractVerificationInsert = async (contract: ContracVerificationInsert): Promise<void> => {
  const timestamp = Date.now();
  await query(
    INSERT_CONTRACT_VERIFICATION,
    [
      crypto.randomBytes(20).toString('hex'),
      contract.address,
      contract.source,
      contract.filename,
      contract.compilerVersion,
      contract.constructorArguments,
      contract.optimization,
      contract.runs,
      contract.target,
      contract.license,
      contract.status,
      timestamp,
    ]
  );
};

const FIND_VERIFIED_CONTRACT = `SELECT * FROM contract WHERE processed_bytecode = $1 AND verified = TRUE`;
export const checkIfContractIsVerified = async (bytecode: string): Promise<boolean> => {
  const result = await query(FIND_VERIFIED_CONTRACT, [bytecode]);
  return result.length > 0;
}

const CONTRACT_VERIFICATION_STATUS = `SELECT status FROM contract_verification_request WHERE id = $1`;
export const contractVerificationStatus = async (id: string): Promise<string> => {
  const result = await query<Status>(CONTRACT_VERIFICATION_STATUS, [id]);
  ensure(result.length > 0, "Contract does not exist...", 404);
  return result[0].status;
}

const UPDATE_CONTRACT_STATUS = `UPDATE contract SET verified = TRUE, processed_bytecode = $1 WHERE contract_id = $2`;
export const updateContractStatus = async (address: string, bytecode: string): Promise<void> => {
  await query(UPDATE_CONTRACT_STATUS, [bytecode, address]);
};

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
export const findUserTokens = async (address: string): Promise<UserTokenDB[]> =>
  query<UserTokenDB>(FIND_USER_TOKENS, [address]);


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
export const findStakingRewards = async (): Promise<StakingRewardDB[]> => 
  query<StakingRewardDB>(FIND_STAKING_REWARDS, []);

interface Balance {
  balance: number;
}
const FIND_USER_BALANCE = `SELECT balance FROM token_holder WHERE (holder_account_id = $1 OR holder_evm_address = $1) AND contract_id = $2`;
const REEF_CONTRACT = '0x0000000000000000000000000000000001000000';
export const userBalance = async (address: string): Promise<number> => {
  const balances = await query<Balance>(FIND_USER_BALANCE, [address, REEF_CONTRACT]);
  ensure(balances.length > 0, "User does not have token", 404);
  return balances[0].balance;
}

const FIND_TOKEN = `SELECT name, icon_url, decimals FROM contract WHERE contract_id = $1`;
export const findToken = async (tokenAddress: string): Promise<Token> => {
  const res = await query<Token>(FIND_TOKEN, [tokenAddress]);
  ensure(res.length > 0, 'Token does not exist', 404);
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
  const tokens = await query<TokenDB>(FIND_USER_TOKEN, [tokenAddress, userAddress]);
  ensure(tokens.length > 0, "User does not have desired token", 404);
  return {...tokens[0],
    iconUrl: tokens[0].icon_url
  };
}

const FIND_USER_POOL_BALANCE = 'SELECT balance FROM pool_user WHERE pool_address = $1 AND user_address = $2';
export const findUserPoolBalance = async (poolAddress: string, userAddress: string): Promise<Balance> => {
  const balance = await query<Balance>(FIND_USER_POOL_BALANCE, [poolAddress, userAddress]);
  ensure(balance.length > 0, "User is not in pool", 404);
  return balance[0];
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
export const findPool = async (tokenAddress1: string, tokenAddress2: string): Promise<Pool> => {
  const pools = await query<PoolDB>(FIND_POOL, [tokenAddress1, tokenAddress2]);
  ensure(pools.length > 0, 'Pool does not exist', 404);

  return {...pools[0],
    totalSupply: pools[0].total_supply,
    minimumLiquidity: pools[0].minimum_liquidity,
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
  minimum_liquidity,
  pu.balance
FROM 
  pool as p,
  pool_user as pu
WHERE
  p.token1 = $1 AND 
  p.token2 = $2 AND
  pu.user_address = $3 AND
  p.pool_address = pu.pool_address`;
export const findUserPool = async (tokenAddress1: string, tokenAddress2: string, userAddress: string): Promise<Pool> => {
  const pools = await query<PoolDB>(FIND_USER_POOL, [tokenAddress1, tokenAddress2, userAddress]);
  ensure(pools.length > 0, "User is not in pool...", 404);

  return {
    address: pools[0].address,
    decimals: pools[0].decimals,
    reserve1: pools[0].reserve1,
    reserve2: pools[0].reserve2,
    totalSupply: pools[0].total_supply,
    userPoolBalance: pools[0].balance,
    minimumLiquidity: pools[0].minimum_liquidity,
  };
}

const FIND_CONTRACT_BYTECODE = `
SELECT bytecode
FROM contract
WHERE contract_id = $1`;
export const findContractBytecode = async (address: string): Promise<string> => {
  const bytecodes = await query<Bytecode>(FIND_CONTRACT_BYTECODE, [address]);
  ensure(bytecodes.length > 0, "Contract does not exist", 404);
  return bytecodes[0].bytecode;
}
