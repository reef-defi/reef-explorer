import { query } from "../utils/connector"

interface BlockID {
  id: string;
}

export const lastBlockInDatabase = async (): Promise<number> => {
  const result = await query<BlockID>("SELECT ID FROM block ORDER By id DESC LIMIT 1");
  return result.length === 0 ? -1 : parseInt(result[0].id, 10);
}

export const blockFinalized = async (blockId: number): Promise<void> => {
  await query(`UPDATE block SET finalized = true WHERE id = ${blockId}`);
}

interface InsertInitialBlock {
  id: number;
  hash: string;
  author: string;
  stateRoot: string;
  parentHash: string;
  extrinsicRoot: string;
}

export const insertInitialBlock = async ({id, hash, author, parentHash, stateRoot, extrinsicRoot}: InsertInitialBlock): Promise<void> => {
  await query(`
    INSERT INTO block
      (id, hash, author, state_root, parent_hash, extrinsic_root, finalized)
    VALUES
      (${id}, '${hash}', '${author}', '${stateRoot}', '${parentHash}', '${extrinsicRoot}', FALSE);
  `);
};