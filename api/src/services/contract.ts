import { query } from "../connector";
import { PoolDB, Pool, Target } from "../types";
import { ensure } from "../utils";

interface TokenInfoDefault {
  name: string;
  runs: number;
  signer: string;
  source: string;
  target: Target;
  verified: string;
  optimization: boolean;
}

interface TokenInfo extends TokenInfoDefault {
  deployedBytecode: string;
  compilerVersion: string;
  compilerData: string;
}

interface TokenInfoDB extends TokenInfoDefault {
  compiler_version: string;
  deployment_bytecode: string;
  compiler_data: string;
}


interface StakingRewardDB {
  data: string;
  phase: string;
  method: string;
  section: string;
  timestamp: string;
  event_index: number;
  block_number: number;
}

const FIND_TOKEN_INFO = `SELECT name, verified, deployment_bytecode, compiler_data, source, compiler_version, optimization, runs, target
FROM contract
WHERE contract_id = $1`;

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


export const findTokenInfo = async (address: string): Promise<TokenInfo[]> => {
  const results = await query<TokenInfoDB>(
    FIND_TOKEN_INFO,
    [address]
  );
  ensure(results.length > 0, `Contract with address: ${address}, does not exist`);
  return results
    .map((token) =>
      ({...token, 
        compilerVersion: token.compiler_version,
        deployedBytecode: token.deployment_bytecode,
        compilerData: token.compiler_data,
      }));
}

export const findStakingRewards = async (): Promise<StakingRewardDB[]> => 
  query<StakingRewardDB>(FIND_STAKING_REWARDS, []);


export const findPoolQuery = async (tokenAddress1: string, tokenAddress2: string): Promise<Pool> => {
  const pools = await query<PoolDB>(FIND_POOL, [tokenAddress1, tokenAddress2]);
  ensure(pools.length > 0, 'Pool does not exist', 404);

  return {...pools[0],
    totalSupply: pools[0].total_supply,
    minimumLiquidity: pools[0].minimum_liquidity,
    userPoolBalance: "0",
  }
}