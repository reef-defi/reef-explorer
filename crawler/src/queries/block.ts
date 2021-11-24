import { insert, insertAndGetId, query } from "../utils/connector"

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

interface InsertBlockValues extends InsertInitialBlock {
  finalized: boolean;
}

const blockValuesStatement = ({id, hash, author, stateRoot, parentHash, extrinsicRoot, finalized}: InsertBlockValues): string =>
  `(${id}, '${hash}', '${author}', '${stateRoot}', '${parentHash}', '${extrinsicRoot}', ${finalized})`;


export const insertMultipleBlocks = async (data: InsertBlockValues[]): Promise<void> => insert(`
INSERT INTO block
    (id, hash, author, state_root, parent_hash, extrinsic_root, finalized)
  VALUES
    ${data.map(blockValuesStatement).join(",\n")}
  ON CONFLICT DO NOTHING;
`)

// TODO use insert multiple blocks!
export const insertInitialBlock = async (data: InsertInitialBlock): Promise<number> => insertAndGetId(`
INSERT INTO block
  (id, hash, author, state_root, parent_hash, extrinsic_root, finalized)
VALUES
  ${blockValuesStatement({...data, finalized: false})}
ON CONFLICT DO NOTHING;
`, 'block');