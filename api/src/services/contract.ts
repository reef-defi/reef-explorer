import { query, queryDb } from '../utils/connector';
import { PoolDB, Pool, Target } from '../utils/types';
import { ensure } from '../utils/utils';

interface TokenInfoDefault {
  name: string;
  runs: number;
  source: string;
  target: Target;
  optimization: boolean;
}

interface TokenInfo extends TokenInfoDefault {
  compilerversion: string;
  compileddata: string;
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

const FIND_TOKEN_INFO = `SELECT name, compiled_data as compileddata, source, compiler_version as compilerversion, optimization, runs, target
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

export const findTokenInfo = async (address: string): Promise<TokenInfo> => {
  const results = await query<TokenInfo>(
    FIND_TOKEN_INFO,
    [address],
  );
  ensure(results.length > 0, `Contract with address: ${address}, does not exist`);
  return results[0];
};

export const findStakingRewards = async (): Promise<StakingRewardDB[]> => query<StakingRewardDB>(FIND_STAKING_REWARDS, []);

export const findPoolQuery = async (tokenAddress1: string, tokenAddress2: string): Promise<Pool> => {
  const pools = await query<PoolDB>(FIND_POOL, [tokenAddress1, tokenAddress2]);
  ensure(pools.length > 0, 'Pool does not exist', 404);

  return {
    ...pools[0],
    totalSupply: pools[0].total_supply,
    minimumLiquidity: pools[0].minimum_liquidity,
    userPoolBalance: '0',
  };
};

interface FindContractDB {
  address: string;
  bytecode: string;
}

export const findContractDB = async (address: string) => query<FindContractDB>(
  'SELECT address, bytecode FROM contract WHERE address = $1',
  [address],
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
  contractdata: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const findERC20Token = async (address: string): Promise<ERC20Token> => {
  const res = await queryDb<GetERC20>(`SELECT contract_data as contractData, name, address FROM verified_contract WHERE type='ERC20' AND address='${address}';`);
  ensure(res.length > 0, 'Token does not exist');
  const data = res[0].contractdata;
  return {
    name: res[0].name,
    address: res[0].address,
    decimals: data.decimals,
    tokenName: data.name,
    tokenSymbol: data.symbol,
  };
};

export const getERC20Tokens = async (): Promise<ERC20Token[]> => {
  const res = await queryDb<GetERC20>("SELECT address, name, contract_data as contractdata FROM verified_contract WHERE type='ERC20';");
  console.log(res);
  return res
    .map(({ address, name, contractdata }) => ({
      name,
      address,
      decimals: contractdata.decimals,
      tokenName: contractdata.name,
      tokenSymbol: contractdata.symbol,
    }));
};

interface TokenBalace {
  balance: string;
  decimals: string;
}

export const findTokenAccountTokenBalance = async (accountAddress: string, contractAddress: string): Promise<TokenBalace[]> => queryDb<TokenBalace>(`SELECT balance, decimals FROM token_holder WHERE token_address='${contractAddress}' AND signer='${accountAddress}';`);
