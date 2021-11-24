import { ExtrinsicStatus, SignedExtrinsicData } from "../crawler/types";
import { insertAndGetId, insert, query } from "../utils/connector";

export interface InsertExtrinsic {
  blockId: number;
  index: number;
  hash: string;
  args: string;
  docs: string;
  method: string;
  section: string;
  signed: string;
  status: string;
  error_message: string;
}

export interface InsertExtrinsicBody extends InsertExtrinsic {
  id: number;
  signedData?: SignedExtrinsicData;
}

const extrinsicToValue = ({id, blockId, index, hash, args, docs, method, section, status, error_message, signed, signedData}: InsertExtrinsicBody): string => `
(
  ${id}, ${blockId}, ${index}, '${hash}', '${args}', '${docs.replace(/'/g, "''")}', '${method}', 
  '${section}', '${signed}', '${status}', '${error_message}', 
  ${signedData ? "'signed'" : "'unsigned'"}, ${signedData ? JSON.stringify(signedData) : "null"}
)
`

export const insertExtrinsics = (extrinsics: InsertExtrinsicBody[]): Promise<void> => insert(`
INSERT INTO extrinsic
  (id, block_id, index, hash, args, docs, method, section, signed, status, error_message, type, signed_data})
VALUES
  ${extrinsics.map(extrinsicToValue).join(",")}
ON CONFLICT DO NOTHING;
`)

export const insertExtrinsic = async (
  {blockId, index, hash, args, docs, method, section, status, error_message, signed}: InsertExtrinsic, 
  signedData?: SignedExtrinsicData): Promise<number> => insertAndGetId(`
INSERT INTO extrinsic
  (block_id, index, hash, args, docs, method, section, signed, status, error_message, type ${signedData ? ', signed_data' : ''})
VALUES
  (${blockId}, ${index}, '${hash}', '${args}', '${docs.replace(/'/g, "''")}', '${method}', 
  '${section}', '${signed}', '${status}', '${error_message}', ${signedData ? "'signed'" : "'unsigned'"} 
  ${signedData ? ", '" + JSON.stringify(signedData) + "'" : ''})
ON CONFLICT DO NOTHING;
`, 'extrinsic');

interface InsertTransfer {
  blockId: number;
  extrinsicId: number;

  denom: string;
  toAddress: string;
  fromAddress: string;
  amount: string;
  feeAmount: string;

  success: boolean;
  errorMessage: string;
}

export const insertTransfer = async ({blockId, extrinsicId, denom, toAddress, fromAddress, amount, feeAmount, success, errorMessage}: InsertTransfer): Promise<number> => insertAndGetId(`
INSERT INTO transfer
  (block_id, extrinsic_id, denom, to_address, from_address, amount, fee_amount, success, error_message)
VALUES
  (${blockId}, ${extrinsicId}, '${denom}', '${toAddress}', '${fromAddress}', ${amount === "" ? "0" : amount}, ${feeAmount === "" ? "0" : amount}, '${success}', '${errorMessage}');
`, 'transfer'
);

interface InsertContract {
  address: string;
  extrinsicId: number;

  bytecode: string;
  bytecodeContext: string;
  bytecodeArguments: string;

  gasLimit: string;
  storageLimit: string;
}

export const insertContract = async ({address, extrinsicId, bytecode, bytecodeContext, bytecodeArguments, gasLimit, storageLimit}: InsertContract): Promise<void> => insert(`
INSERT INTO contract
  (address, extrinsic_id, bytecode, bytecode_context, bytecode_arguments, gas_limit, storage_limit)
VALUES
  ('${address}', ${extrinsicId}, '${bytecode}', '${bytecodeContext}', '${bytecodeArguments}', ${gasLimit}, ${storageLimit})
ON CONFLICT DO NOTHING;
`);


interface InsertUnverifiedEvmEvent {
  extrinsicId: number;
  account: string;
  contractAddress: string;
  data: string;
  gasLimit: string;
  storageLimit: string;
  status: ExtrinsicStatus;
}

export const insertUnverifiedEvmCall = async ({extrinsicId, contractAddress, storageLimit, gasLimit, data, account, status}: InsertUnverifiedEvmEvent): Promise<void> => insert(`
INSERT INTO unverified_evm_call
  (extrinsic_id, signer_address, contract_address, data, gas_limit, storage_limit, status, error_message)
VALUES
  (${extrinsicId}, '${account}', '${contractAddress}', '${data}', ${gasLimit}, ${storageLimit}, '${status.type === 'success' ? 'success' : 'error'}', '${status.type === 'error' ? status.message : ''}');
`);
