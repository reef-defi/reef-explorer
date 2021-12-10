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


const accountToInsertValue = ({address, evmAddress, blockId, active, freeBalance, availableBalance, lockedBalance}: AccountBody): string => `
  ('${address}', '${evmAddress}', ${blockId}, ${active}, ${freeBalance}, ${lockedBalance}, ${availableBalance})`;

export const insertAccounts = async (accounts: AccountBody[]): Promise<void> => {
  if (accounts.length > 0) {
    await insert(`
INSERT INTO account
  (address, evm_address, block_id, active, free_balance, locked_balance, available_balance)
VALUES
  ${accounts.map(accountToInsertValue).join(",")}
ON CONFLICT (address) DO UPDATE SET
  active = EXCLUDED.active,
  block_id = EXCLUDED.block_id,
  evm_address = EXCLUDED.evm_address,
  free_balance = EXCLUDED.free_balance,
  locked_balance = EXCLUDED.locked_balance,
  available_balance = EXCLUDED.available_balance;
`);
  }
}