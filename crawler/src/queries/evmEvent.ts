import {
  TokenHolder,
  Contract,
  ERC20Token,
  EVMCall,
  VerifiedContract,
} from '../crawler/types';
import { insert, insertV2, query } from '../utils/connector';

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

const toTokenHolderInsertValue = ({
  signer,
  balance,
  contractAddress,
  decimals,
  evmAddress,
  type,
  timestamp,
}: TokenHolder): any[] => [signer === '' ? null : signer, evmAddress === '' ? null : evmAddress, type, contractAddress.toLocaleLowerCase(), balance, JSON.stringify({decimals}), timestamp];

export const insertAccountTokenHolders = async (
  accountTokenHolders: TokenHolder[],
): Promise<void> => {
  await insertV2(`
    INSERT INTO token_holder
      (signer, evm_address, type, token_address, balance, info, timestamp)
    VALUES
      %L
    ON CONFLICT (signer, token_address) WHERE evm_address IS NULL DO UPDATE SET
      balance = EXCLUDED.balance,
      timestamp = EXCLUDED.timestamp,
      info = EXCLUDED.info;
  `, accountTokenHolders.map(toTokenHolderInsertValue));
};

export const insertContractTokenHolders = async (
  contractTokenHolders: TokenHolder[],
): Promise<void> => {
  await insertV2(`
    INSERT INTO token_holder
      (signer, evm_address, type, token_address, balance, info, timestamp)
    VALUES
      %L
    ON CONFLICT (evm_address, token_address) WHERE signer IS NULL DO UPDATE SET
      balance = EXCLUDED.balance,
      timestamp = EXCLUDED.timestamp,
      info = EXCLUDED.info;
  `, contractTokenHolders.map(toTokenHolderInsertValue));
};

export const getERC20Tokens = async (): Promise<ERC20Token[]> => query<ERC20Token>(
  'SELECT address, contract_data, name FROM verified_contract WHERE type=\'ERC20\';',
);

export const getContractDB = async (
  address: string,
): Promise<VerifiedContract[]> => query<VerifiedContract>(
  `SELECT address, type, contract_data, compiled_data, name FROM verified_contract WHERE address='${address}';`,
);
