import { query, queryDb } from "../utils/connector";
import { Pool, PoolDB, User, UserTokenBalance } from "../utils/types";
import { ensure } from "../utils/utils";

// interface UserTokenDB {
//   contract_id: string;
//   holder_account_id: string;
//   holder_evm_address: string;
//   balance: string;
//   token_decimals: string;
//   token_symbol: string;
// }

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

// const FIND_USER_TOKENS = `SELECT * FROM contract WHERE owner = $1;`;

// export const findUserPool = async (tokenAddress1: string, tokenAddress2: string, userAddress: string): Promise<Pool> => {
//   const pools = await query<PoolDB>(FIND_USER_POOL, [tokenAddress1, tokenAddress2, userAddress]);
//   ensure(pools.length > 0, "User is not in pool...", 404);

//   return {
//     address: pools[0].address,
//     decimals: pools[0].decimals,
//     reserve1: pools[0].reserve1,
//     reserve2: pools[0].reserve2,
//     totalSupply: pools[0].total_supply,
//     userPoolBalance: pools[0].balance,
//     minimumLiquidity: pools[0].minimum_liquidity,
//   };
// }


export const getAllUsersWithEvmAddress = async (): Promise<User[]> => 
  queryDb<User>(`
    SELECT address, evm_address, free_balance, locked_balance, available_balance 
    FROM account 
    WHERE active=true AND LENGTH(evm_address) = 42;
  `);

interface UserTokenDB {
  address: string;
  contract_data: string;
}

export const findUserTokens = async (address: string): Promise<UserTokenDB[]> =>
  queryDb<UserTokenDB>(
    `SELECT c.address as address, v.contract_data as contract_data FROM contract as c
      INNER JOIN verified_contract as v
        ON c.address = v.address
      WHERE c.owner='${address}' AND v.type='ERC20';
    `
  );
  // query(FIND_USER_TOKENS, [address]);

interface Contract {
  address: string;
}

export const findUserContracts = async (address: string): Promise<Contract[]> => 
  queryDb<Contract>(`SELECT address FROM contract WHERE owner='${address}'`);


const userTokenBalanceToValue = ({tokenAddress, address, evm_address, balance, decimals}: UserTokenBalance): string => 
`('${tokenAddress.toLowerCase()}', '${address}', '${evm_address}', 'Account', ${balance}, ${decimals}, '${(new Date().toUTCString())}')`;

export const insertTokenHolder = async (accountTokenBalances: UserTokenBalance[]): Promise<void> => {
  if (accountTokenBalances.length === 0) { return; }
  await queryDb(`
    INSERT INTO token_holder 
      (token_address, signer, evm_address, type, balance, decimals, timestamp)
    VALUES
      ${accountTokenBalances.map(userTokenBalanceToValue).join(",\n")}
    ON CONFLICT (token_address, evm_address) DO UPDATE SET
      signer = EXCLUDED.signer,
      balance = EXCLUDED.balance,
      decimals = EXCLUDED.decimals;
  `)
}