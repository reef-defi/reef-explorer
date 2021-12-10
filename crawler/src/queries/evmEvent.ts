import { AccountTokenBalance, Contract, ERC20Token, EVMCall } from "../crawler/types";
import { insert, query } from "../utils/connector";


const contractToValues = ({address, extrinsicId, bytecode, bytecodeContext, bytecodeArguments, gasLimit, storageLimit}: Contract): string => 
  `('${address}', ${extrinsicId}, '${bytecode}', '${bytecodeContext}', '${bytecodeArguments}', ${gasLimit}, ${storageLimit})`
  
const evmCallToValue = ({extrinsicId, contractAddress, storageLimit, gasLimit, data, account, status}: EVMCall): string => 
  `(${extrinsicId}, '${account}', '${contractAddress}', '${data}', ${gasLimit}, ${storageLimit}, '${status.type === 'success' ? 'success' : 'error'}', '${status.type === 'error' ? status.message : ''}')`


export const insertContracts = async (contracts: Contract[]): Promise<void> => {
  if (contracts.length === 0) { return; }
  await insert(`
    INSERT INTO contract
      (address, extrinsic_id, bytecode, bytecode_context, bytecode_arguments, gas_limit, storage_limit)
    VALUES
      ${contracts.map(contractToValues).join(",\n")}
    ON CONFLICT (address) DO UPDATE
      SET extrinsic_id = EXCLUDED.extrinsic_id,
          bytecode = EXCLUDED.bytecode,
          bytecode_context = EXCLUDED.bytecode_context,
          bytecode_arguments = EXCLUDED.bytecode_arguments,
          gas_limit = EXCLUDED.gas_limit,
          storage_limit = EXCLUDED.storage_limit;
  `)
}

export const insertEvmCalls = async (evmCalls: EVMCall[]): Promise<void> => {
  if (evmCalls.length === 0) { return; }
  await insert(`
    INSERT INTO unverified_evm_call
      (extrinsic_id, signer_address, contract_address, data, gas_limit, storage_limit, status, error_message)
    VALUES
      ${evmCalls.map(evmCallToValue).join(",\n")};
  `)
}

export const insertContract = async (contract: Contract): Promise<void> =>
  insertContracts([contract]);

export const insertEvmCall = async (call: EVMCall): Promise<void> => 
  insertEvmCalls([call])


const accountTokenBalanceToValue = ({accountAddress, balance, contractAddress, decimals}: AccountTokenBalance): string => 
  `('${accountAddress.toLowerCase()}', '${contractAddress.toLowerCase()}', ${balance}, ${decimals})`;

export const insertAccountTokenBalances = async (accountTokenBalances: AccountTokenBalance[]): Promise<void> => {
  if (accountTokenBalances.length === 0) { return; }
  await insert(`
    INSERT INTO account_token_balance
      (account_address, token_address, balance, decimals)
    VALUES
      ${accountTokenBalances.map(accountTokenBalanceToValue).join(",\n")}
    ON CONFLICT (account_address, token_address) DO UPDATE SET
      balance = EXCLUDED.balance,
      decimals = EXCLUDED.decimals;
  `)
}

export const getERC20Tokens = async (): Promise<ERC20Token[]> => 
  query<ERC20Token>(`SELECT address, contract_data, name FROM verified_contract WHERE type='ERC20';`)
  
  
  export const findErc20TokenDB = async (address: string): Promise<ERC20Token[]> =>
    query<ERC20Token>(`SELECT address, contract_data, compiled_data, name FROM verified_contract WHERE type='ERC20' AND address='${address}';`);