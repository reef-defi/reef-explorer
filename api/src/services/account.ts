import { queryDb } from '../utils/connector';
import {
  User, UserTokenBalance,
} from '../utils/types';

export const getAllUsersWithEvmAddress = async (): Promise<User[]> => queryDb<User>(`
    SELECT address, evm_address as evmAddress, free_balance as freeBalance, locked_balance as lockedBalance, available_balance as availableBalance 
    FROM account 
    WHERE active=true AND LENGTH(evm_address) = 42;
  `);

interface UserTokenDB {
  address: string;
  contract_data: string;
}

export const findUserTokens = async (address: string): Promise<UserTokenDB[]> => queryDb<UserTokenDB>(
  `SELECT th.token_address as address, th.balance as balance, v.contract_data as contract_data FROM token_holder as th
      INNER JOIN verified_contract as v
        ON th.token_address = v.address
      WHERE th.signer='${address}';
    `,
);

interface Contract {
  address: string;
}

export const findUserContracts = async (address: string): Promise<Contract[]> => queryDb<Contract>(`SELECT address FROM contract WHERE signer='${address}'`);

const userTokenBalanceToValue = ({
  tokenAddress, address, evmaddress, balance, decimals,
}: UserTokenBalance): string => `('${tokenAddress.toLowerCase()}', '${address}', '${evmaddress}', 'Account', ${balance}, ${decimals}, '${(new Date().toUTCString())}')`;

export const insertTokenHolder = async (accountTokenBalances: UserTokenBalance[]): Promise<void> => {
  if (accountTokenBalances.length === 0) { return; }
  await queryDb(`
    INSERT INTO token_holder 
      (token_address, signer, evm_address, type, balance, decimals, timestamp)
    VALUES
      ${accountTokenBalances.map(userTokenBalanceToValue).join(',\n')}
    ON CONFLICT (token_address, evm_address) DO UPDATE SET
      signer = EXCLUDED.signer,
      balance = EXCLUDED.balance,
      decimals = EXCLUDED.decimals;
  `);
};
