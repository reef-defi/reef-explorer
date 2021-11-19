import { insert, query } from "../utils/connector"

interface BlockID {
  id: string;
}

interface InsertInitialBlock {
  id: number;
  hash: string;
  author: string;
  stateRoot: string;
  parentHash: string;
  extrinsicRoot: string;
}

export const lastBlockInDatabase = async (): Promise<number> => {
  const result = await query<BlockID>("SELECT ID FROM block ORDER By id DESC LIMIT 1");
  return result.length === 0 ? -1 : parseInt(result[0].id, 10);
}

export const blockFinalized = async (blockId: number): Promise<void> => {
  await query(`UPDATE block SET finalized = true WHERE id = ${blockId}`);
}

export const insertInitialBlock = async ({id, hash, author, parentHash, stateRoot, extrinsicRoot}: InsertInitialBlock): Promise<number> => insert(`
INSERT INTO block
  (id, hash, author, state_root, parent_hash, extrinsic_root, finalized)
VALUES
  (${id}, '${hash}', '${author}', '${stateRoot}', '${parentHash}', '${extrinsicRoot}', FALSE)
ON CONFLICT DO NOTHING;
`, 'block');

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

export interface SignedExtrinsicData {
  // TODO set tipes
  fee: any;
  feeDetails: any;
}

export const insertExtrinsic = async (
  {blockId, index, hash, args, docs, method, section, status, error_message, signed}: InsertExtrinsic, 
  signedData?: SignedExtrinsicData): Promise<number> => insert(`
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

export const insertTransfer = async ({blockId, extrinsicId, denom, toAddress, fromAddress, amount, feeAmount, success, errorMessage}: InsertTransfer): Promise<number> => insert(`
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

export const insertContract = async ({address, extrinsicId, bytecode, bytecodeContext, bytecodeArguments, gasLimit, storageLimit}: InsertContract): Promise<number> => insert(`
INSERT INTO contract
  (address, extrinsic_id, bytecode, bytecode_context, bytecode_arguments, gas_limit, storage_limit)
VALUES
  ('${address}', ${extrinsicId}, '${bytecode}', '${bytecodeContext}', '${bytecodeArguments}', ${gasLimit}, ${storageLimit});
`, 'contract');