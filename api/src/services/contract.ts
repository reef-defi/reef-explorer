import { query, queryDb } from "../utils/connector";
import { PoolDB, Pool, Target } from "../utils/types";
import { ensure } from "../utils/utils";

interface TokenInfoDefault {
  name: string;
  runs: number;
  owner: string;
  source: string;
  target: Target;
  verified: string;
  bytecode: string;
  optimization: boolean;
}

interface TokenInfo extends TokenInfoDefault {
  compilerVersion: string;
  compilerData: string;
}

interface TokenInfoDB extends TokenInfoDefault {
  compiler_data: string;
  compiler_version: string;
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

const FIND_TOKEN_INFO = `SELECT name, owner, verified, bytecode, compiler_data, source, compiler_version, optimization, runs, target
FROM verified_contract
WHERE address = $1`;

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


const toTokenInfo = ({compiler_data, compiler_version, verified, bytecode, owner, name, runs, target, source, optimization}: TokenInfoDB): TokenInfo => ({
  name, runs, target, owner, source, optimization, verified, bytecode,
  compilerData: compiler_data,
  compilerVersion: compiler_version,
});

export const findTokenInfo = async (address: string): Promise<TokenInfo[]> => {
  const results = await query<TokenInfoDB>(
    FIND_TOKEN_INFO,
    [address]
  );
  ensure(results.length > 0, `Contract with address: ${address}, does not exist`);
  return results.map(toTokenInfo);
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

interface FindContractDB {
  address: string;
  bytecode: string;
}

export const findContractDB = async (address: string) => query<FindContractDB>(
  'SELECT address, bytecode FROM contract WHERE address = $1',
  [address]
);

interface VerifiedContractBase {
  name: string;
  address: string;
}

interface ERC20Token extends VerifiedContractBase {
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
}

interface GetERC20 extends VerifiedContractBase {
  contract_data: string;
}

export const findERC20Token = async (address: string): Promise<ERC20Token> => {
  const res = await queryDb<GetERC20>(`SELECT contract_data, name, address FROM verified_contract WHERE type='ERC20' AND address='${address}';`);
  ensure(res.length > 0, 'Token does not exist');
  const data = JSON.parse(res[0].contract_data);
  return {
    name: res[0].name,
    address: res[0].address,
    decimals: data["decimals"],
    tokenName: data["name"],
    tokenSymbol: data["symbol"],
  }
}

export const getERC20Tokens = async (): Promise<ERC20Token[]> => {
  const res = await queryDb<GetERC20>("SELECT address, name, contract_data FROM verified_contract WHERE type='ERC20';");
  return res
  .map(({address, name, contract_data}) => {
    const data = JSON.parse(contract_data);
    return {
      name,
      address,
      decimals: data["decimals"],
      tokenName: data["name"],
      tokenSymbol: data['symbol'],
    };
  });
}

interface TokenBalace {
  balance: string;
  decimals: string; 
}

export const findTokenAccountTokenBalance = async (accountAddress: string, contractAddress: string): Promise<TokenBalace[]> => 
  queryDb<TokenBalace>(`SELECT balance, decimals FROM account_token_balance WHERE token_address='${contractAddress}' AND signer='${accountAddress}';`);