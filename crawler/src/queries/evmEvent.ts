import {
  TokenHolder,
  Contract,
  ERC20Token,
  EVMCall,
} from '../crawler/types';
import { insert, query } from '../utils/connector';

const contractToValues = ({
  address,
  extrinsicId,
  bytecode,
  bytecodeContext,
  bytecodeArguments,
  gasLimit,
  storageLimit,
  signer,
  timestamp,
}: Contract): string => `('${address}', ${extrinsicId}, '${signer}', '${bytecode}', '${bytecodeContext}', '${bytecodeArguments}', ${gasLimit}, ${storageLimit}, '${timestamp}')`;

const evmCallToValue = ({
  extrinsicId,
  contractAddress,
  storageLimit,
  gasLimit,
  data,
  account,
  status,
  timestamp,
}: EVMCall): string => `(${extrinsicId}, '${account}', '${contractAddress}', '${data}', ${gasLimit}, ${storageLimit}, '${
  status.type === 'success' ? 'success' : 'error'
}', '${status.type === 'error' ? status.message : ''}', '${timestamp}')`;

export const insertContracts = async (contracts: Contract[]): Promise<void> => {
  if (contracts.length === 0) {
    return;
  }
  await insert(`
    INSERT INTO contract
      (address, extrinsic_id, signer, bytecode, bytecode_context, bytecode_arguments, gas_limit, storage_limit, timestamp)
    VALUES
      ${contracts.map(contractToValues).join(',\n')}
    ON CONFLICT (address) DO UPDATE
      SET extrinsic_id = EXCLUDED.extrinsic_id,
        bytecode = EXCLUDED.bytecode,
        gas_limit = EXCLUDED.gas_limit,
        timestamp = EXCLUDED.timestamp,
        storage_limit = EXCLUDED.storage_limit,
        bytecode_context = EXCLUDED.bytecode_context,
        bytecode_arguments = EXCLUDED.bytecode_arguments;
  `);
};

export const insertEvmCalls = async (evmCalls: EVMCall[]): Promise<void> => {
  if (evmCalls.length === 0) {
    return;
  }
  await insert(`
    INSERT INTO unverified_evm_call
      (extrinsic_id, signer, contract_address, data, gas_limit, storage_limit, status, error_message, timestamp)
    VALUES
      ${evmCalls.map(evmCallToValue).join(',\n')};
  `);
};

export const insertContract = async (contract: Contract): Promise<void> => insertContracts([contract]);

export const insertEvmCall = async (call: EVMCall): Promise<void> => insertEvmCalls([call]);

const accountTokenBalanceToValue = ({
  signer,
  balance,
  contractAddress,
  decimals,
  evmAddress,
  type,
  timestamp,
}: TokenHolder): string => `(${signer === 'null' ? signer : `'${signer}'`}, '${evmAddress.toLowerCase()}', '${type}', '${contractAddress.toLowerCase()}', ${balance}, ${decimals}, '${timestamp}')`;

export const insertAccountTokenBalances = async (
  accountTokenBalances: TokenHolder[],
): Promise<void> => {
  if (accountTokenBalances.length === 0) {
    return;
  }
  await insert(`
    INSERT INTO token_holder
      (signer, evm_address, type, token_address, balance, decimals, timestamp)
    VALUES
      ${accountTokenBalances.map(accountTokenBalanceToValue).join(',\n')}
    ON CONFLICT (evm_address, token_address) DO UPDATE SET
      signer = EXCLUDED.signer,
      balance = EXCLUDED.balance,
      timestamp = EXCLUDED.timestamp,
      decimals = EXCLUDED.decimals;
  `);
};

export const getERC20Tokens = async (): Promise<ERC20Token[]> => query<ERC20Token>(
  'SELECT address, contract_data, name FROM verified_contract WHERE type=\'ERC20\';',
);

export const findErc20TokenDB = async (
  address: string,
): Promise<ERC20Token[]> => query<ERC20Token>(
  `SELECT address, contract_data, compiled_data, name FROM verified_contract WHERE type='ERC20' AND address='${address}';`,
);
