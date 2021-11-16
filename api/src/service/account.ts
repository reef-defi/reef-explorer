import { query } from "../connector";
import { Pool, PoolDB } from "../types";
import { ensure } from "../utils";

interface UserTokenDB {
  contract_id: string;
  holder_account_id: string;
  holder_evm_address: string;
  balance: string;
  token_decimals: string;
  token_symbol: string;
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

export const findUserTokens = async (address: string): Promise<UserTokenDB[]> =>
  query(FIND_USER_TOKENS, [address]);