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
}: InsertExtrinsicBody): string => {
  let call_evm_contract_address = undefined;
  if(section === 'evm' && method === 'call'){
    try {
      call_evm_contract_address = JSON.parse(args)[0];
    }catch (e){}
  }
  return `(
  ${id}, ${blockId}, ${index}, '${hash}', '${args}', '${call_evm_contract_address}', '${docs.replace(
      /'/g,
      "''",
  )}', '${method}', 
  '${section}', '${signed}', '${status}', '${errorMessage}', 
  ${signedData ? "'signed'" : "'unsigned'"}, ${
      signedData ? `'${JSON.stringify(signedData)}'` : 'null'
  }, '${timestamp}'
)`
};

export const insertExtrinsics = async (
  extrinsics: InsertExtrinsicBody[],
): Promise<void> => {
  if (extrinsics.length > 0) {
    await insert(`
INSERT INTO extrinsic
  (id, block_id, index, hash, args, contract_address_evm_call, docs, method, section, signer, status, error_message, type, signed_data, timestamp)
VALUES
${extrinsics.map((e)=>{
  console.log('aaaa11=',JSON.parse(e.args)[0], e.method, e.section)
  return extrinsicToValue(e)
}).join(',')}
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
  fromEvmAddress,
  toEvmAddress,
  timestamp,
}: Transfer): any[] => [blockId, extrinsicId, denom, toAddress === 'null' ? null : toAddress, fromAddress === 'null' ? null : fromAddress, toEvmAddress, fromEvmAddress, tokenAddress, amount === '' ? '0' : amount, feeAmount === '' ? '0' : feeAmount, success, errorMessage, timestamp];

export const insertTransfers = async (transfers: Transfer[]): Promise<void> => {
  if (transfers.length === 0) {
    return;
  }
  await insertV2(`
    INSERT INTO transfer
      (block_id, extrinsic_id, denom, to_address, from_address, to_evm_address, from_evm_address, token_address, amount, fee_amount, success, error_message, timestamp)
    VALUES
      %L;
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
