import { SignedExtrinsicData, Transfer } from '../crawler/types';
import { insert, insertV2, query } from '../utils/connector';

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
  errorMessage: string;
  timestamp: string;
}

export interface InsertExtrinsicBody extends InsertExtrinsic {
  id: number;
  signedData?: SignedExtrinsicData;
}

const extrinsicToValue = ({
  id,
  blockId,
  index,
  hash,
  args,
  docs,
  method,
  section,
  status,
  errorMessage,
  signed,
  signedData,
  timestamp,
}: InsertExtrinsicBody): string => `(
  ${id}, ${blockId}, ${index}, '${hash}', '${args}', '${docs.replace(
  /'/g,
  "''",
)}', '${method}', 
  '${section}', '${signed}', '${status}', '${errorMessage}', 
  ${signedData ? "'signed'" : "'unsigned'"}, ${
  signedData ? `'${JSON.stringify(signedData)}'` : 'null'
}, '${timestamp}'
)`;

export const insertExtrinsics = async (
  extrinsics: InsertExtrinsicBody[],
): Promise<void> => {
  if (extrinsics.length > 0) {
    await insert(`
INSERT INTO extrinsic
  (id, block_id, index, hash, args, docs, method, section, signer, status, error_message, type, signed_data, timestamp)
VALUES
${extrinsics.map(extrinsicToValue).join(',')}
ON CONFLICT DO NOTHING;
`);
  }
};

export const insertExtrinsic = async (
  extrinsic: InsertExtrinsicBody,
): Promise<void> => insertExtrinsics([extrinsic]);

const transferToValue = ({
  type,
  denom,
  nftId,
  amount,
  blockId,
  success,
  timestamp,
  toAddress,
  feeAmount,
  extrinsicId,
  fromAddress,
  tokenAddress,
  errorMessage,
  toEvmAddress,
  fromEvmAddress,
}: Transfer): any[] => [blockId, extrinsicId, denom || null, nftId || null, toAddress === 'null' ? null : toAddress, fromAddress === 'null' ? null : fromAddress, toEvmAddress, fromEvmAddress, tokenAddress, amount === '' ? '0' : amount, feeAmount === '' ? '0' : feeAmount, success, errorMessage, type, timestamp];

export const insertTransfers = async (transfers: Transfer[]): Promise<void> => {
  if (transfers.length === 0) {
    return;
  }
  await insertV2(`
    BEGIN;
    SELECT * FROM account FOR UPDATE;
    INSERT INTO transfer
      (block_id, extrinsic_id, denom, nft_id, to_address, from_address, to_evm_address, from_evm_address, token_address, amount, fee_amount, success, error_message, type, timestamp)
    VALUES
      %L;
    COMMIT;
  `, transfers.map(transferToValue));
};

interface ID {
  id: string;
}

const nextFreeTableId = async (table: string): Promise<number> => {
  const result = await query<ID>(`SELECT id FROM ${table} ORDER BY id DESC LIMIT 1`);
  return result.length > 0 ? parseInt(result[0].id, 10) + 1 : 0;
};

export const freeEventId = async () => nextFreeTableId('event');
export const freeExtrinsicId = async () => nextFreeTableId('extrinsic');

type EventId = number;
type ExtrinsicId = number;

export const nextFreeIds = async (): Promise<[EventId, ExtrinsicId]> => Promise.all([freeEventId(), freeExtrinsicId()]);
