import { Contract, EVMCall } from "../crawler/types";
import { insert } from "../utils/connector";


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