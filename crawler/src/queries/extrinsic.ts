import { SignedExtrinsicData, Transfer } from '../crawler/types';
import { insert, query } from '../utils/connector';

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
  blockId,
  extrinsicId,
  denom,
  toAddress,
  fromAddress,
  tokenAddress,
  amount,
  feeAmount,
  success,
  errorMessage,
  timestamp,
}: Transfer): string => `(${blockId}, ${extrinsicId}, '${denom}', '${toAddress}', '${fromAddress}', '${tokenAddress}', ${
  amount === '' ? '0' : amount
}, ${feeAmount === '' ? '0' : feeAmount}, '${success}', '${errorMessage}', '${timestamp}')`;

export const insertTransfers = async (transfers: Transfer[]): Promise<void> => {
  if (transfers.length === 0) {
    return;
  }
  await insert(`
    INSERT INTO transfer
      (block_id, extrinsic_id, denom, to_address, from_address, token_address, amount, fee_amount, success, error_message, timestamp)
    VALUES
      ${transfers.map(transferToValue).join(',\n')}
  `);
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
