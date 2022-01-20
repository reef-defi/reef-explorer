import format from 'pg-format';
import { query } from '../utils/connector';
import {
  User, UserTokenBalance,
} from '../utils/types';

export const getAllUsersWithEvmAddress = async (): Promise<User[]> => query<User>(`
    SELECT address, evm_address as evmAddress, free_balance as freeBalance, locked_balance as lockedBalance, available_balance as availableBalance 
    FROM account 
    WHERE active=true AND LENGTH(evm_address) = 42;
  `, []);

interface UserTokenDB {
  address: string;
  balance: string;
  contract_data: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const findUserTokens = async (address: string): Promise<UserTokenDB[]> => query<UserTokenDB>(
  `
  SELECT v.address, t.balance, v.contract_data FROM verified_contract as v
  INNER JOIN contract as c
    ON v.address = c.address
  RIGHT JOIN token_holder as t
    ON v.address = t.token_address AND t.signer = $1
  WHERE v.type = 'ERC20';
    `,
  [address],
);

interface Contract {
  address: string;
}

export const findUserContracts = async (address: string): Promise<Contract[]> => query<Contract>('SELECT address FROM contract WHERE signer=$1;', [address]);

const userTokenBalanceToValue = ({
  tokenAddress, address, evmaddress, balance, decimals,
}: UserTokenBalance): any[] => [tokenAddress.toLowerCase(), address, evmaddress, 'Account', balance.toString(), decimals, new Date().toUTCString()];// `('${tokenAddress.toLowerCase()}', '${address}', '${evmaddress}', 'Account', ${balance}, ${decimals}, '${(new Date().toUTCString())}')`;

export const insertTokenHolder = async (accountTokenBalances: UserTokenBalance[]): Promise<void> => {
  if (accountTokenBalances.length === 0) { return; }
  await query(format(`
    INSERT INTO token_holder 
      (token_address, signer, evm_address, type, balance, decimals, timestamp)
    VALUES
      %L
    ON CONFLICT (token_address, evm_address) DO UPDATE SET
      signer = EXCLUDED.signer,
      balance = EXCLUDED.balance,
      decimals = EXCLUDED.decimals;
  `, accountTokenBalances.map(userTokenBalanceToValue)), []);
};
