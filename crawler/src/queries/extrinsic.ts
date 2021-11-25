import { ExtrinsicStatus, SignedExtrinsicData, Transfer } from "../crawler/types";
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

const extrinsicToValue = ({id, blockId, index, hash, args, docs, method, section, status, error_message, signed, signedData}: InsertExtrinsicBody): string => 
`(
  ${id}, ${blockId}, ${index}, '${hash}', '${args}', '${docs.replace(/'/g, "''")}', '${method}', 
  '${section}', '${signed}', '${status}', '${error_message}', 
  ${signedData ? "'signed'" : "'unsigned'"}, ${signedData ? `'${JSON.stringify(signedData)}'` : "null"}
)`

export const insertExtrinsics = async (extrinsics: InsertExtrinsicBody[]): Promise<void> => {
  if (extrinsics.length > 0) {
    await insert(`
INSERT INTO extrinsic
  (id, block_id, index, hash, args, docs, method, section, signed, status, error_message, type, signed_data)
VALUES
${extrinsics.map(extrinsicToValue).join(",")}
ON CONFLICT DO NOTHING;
`);
  }
}

export const insertExtrinsic = async (extrinsic: InsertExtrinsicBody): Promise<void> => 
  insertExtrinsics([extrinsic]);


const transferToValue = ({blockId, extrinsicId, denom, toAddress, fromAddress, amount, feeAmount, success, errorMessage}: Transfer): string => 
`(${blockId}, ${extrinsicId}, '${denom}', '${toAddress}', '${fromAddress}', ${amount === "" ? "0" : amount}, ${feeAmount === "" ? "0" : amount}, '${success}', '${errorMessage}')`;

export const insertTransfers = async (transfers: Transfer[]): Promise<void> => {
  if (transfers.length === 0) { return; }
  await insert(`
    INSERT INTO transfer
      (block_id, extrinsic_id, denom, to_address, from_address, amount, fee_amount, success, error_message)
    VALUES
      ${transfers.map(transferToValue).join(",\n")}
  `)
}

export const insertTransfer = async (transfer: Transfer): Promise<number> => insertAndGetId(`
INSERT INTO transfer
  (block_id, extrinsic_id, denom, to_address, from_address, amount, fee_amount, success, error_message)
VALUES
  ${transferToValue(transfer)};
`, 'transfer'
);

interface ID {
  id: string;
}

const nextFreeTableId = async (table: string): Promise<number> => {
  const result = await query<ID>(`SELECT id FROM ${table} ORDER BY id DESC`);
  return result.length > 0
    ? parseInt(result[0].id, 10) + 1
    : 0;
}

export const freeEventId = async () => nextFreeTableId('event'); 
export const freeExtrinsicId = async () => nextFreeTableId('extrinsic');

type EventId = number;
type ExtrinsicId = number;

export const nextFreeIds = async (): Promise<[EventId, ExtrinsicId]> => await Promise.all([
  freeEventId(),
  freeExtrinsicId(),
]);

