import { AccountBody } from "../crawler/types";
import { insert, query } from "../utils/connector";


interface InsertEvent {
  index: number;
  blockId: number;
  extrinsicId: number;

  data: string;
  method: string;
  section: string;
}

// export const insertEvent = async ({blockId, extrinsicId, index, data, method, section}: InsertEvent): Promise<void> => insert(`
// INSERT INTO event
//   (block_id, extrinsic_id, index, section, method, data)
// VALUES
//   (${blockId}, ${extrinsicId}, ${index}, '${section}', '${method}', '${data}');
// `)


export const signerExist = async (address: string): Promise<boolean> => {
  const result = await query(`SELECT * FROM account WHERE address = '${address}' AND active = true;`);
  return result.length > 0;
}

export const insertAccount = async (address: string, evmAddress: string, blockId: number): Promise<void> => insert(`
INSERT INTO account
  (address, evm_address, block_id, active)
VALUES
  ('${address}', '${evmAddress}', ${blockId}, true)
ON CONFLICT (address) DO UPDATE SET active = TRUE;
`)

export const deactiveteAccount = async (address: string): Promise<void> => {
  const exists = await signerExist(address);
  if (!exists) { return; }
  await query(`UPDATE account SET active = FALSE WHERE address = '${address}';`);
};

// New

export interface InsertEventValue extends InsertEvent {
  id: number;
}

const toEventValue = ({id, blockId, extrinsicId, index, data, method, section}: InsertEventValue): string => `
  (${id}, ${blockId}, ${extrinsicId}, ${index}, '${section}', '${method}', '${data}')`;

export const insertEvents = async (events: InsertEventValue[]): Promise<void> => {
  if (events.length > 0) {
    insert(`
INSERT INTO event
  (id, block_id, extrinsic_id, index, section, method, data)
VALUES
  ${events.map(toEventValue).join(",")};
`);
  }
}
export const insertEvent = async (event: InsertEventValue) => insertEvents([event]);


const accountToInsertValue = ({address, evmAddress, blockId, active}: AccountBody): string => `
  ('${address}', '${evmAddress}', ${blockId}, ${active})`;

export const insertAccounts = async (accounts: AccountBody[]): Promise<void> => {
  if (accounts.length > 0) {
    await insert(`
INSERT INTO account
  (address, evm_address, block_id, active)
VALUES
  ${accounts.map(accountToInsertValue).join(",")}
ON CONFLICT (address) DO UPDATE SET
  active = EXCLUDED.active,
  block_id = EXCLUDED.block_id,
  evm_address = EXCLUDED.evm_address;
`);
  }
}