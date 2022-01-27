import { insertV2, query, queryv2 } from '../utils/connector';

interface BlockID {
  id: string;
}

interface InsertInitialBlock {
  id: number;
  hash: string;
  author: string;
  stateRoot: string;
  timestamp: string;
  parentHash: string;
  extrinsicRoot: string;
}

export const lastBlockInDatabase = async (): Promise<number> => {
  const result = await query<BlockID>(
    'SELECT ID FROM block ORDER By id DESC LIMIT 1',
  );
  return result.length === 0 ? -1 : parseInt(result[0].id, 10);
};

export const blockFinalized = async (blockId: number): Promise<void> => {
  await query(`UPDATE block SET finalized = true WHERE id = ${blockId}`);
};

const blockValuesStatement = ({
  id,
  hash,
  author,
  stateRoot,
  parentHash,
  extrinsicRoot,
  timestamp,
}: InsertInitialBlock): any[] => [id, hash, author, stateRoot, parentHash, extrinsicRoot, 'false', timestamp];

export const insertMultipleBlocks = async (
  data: InsertInitialBlock[],
): Promise<void> => insertV2(`
INSERT INTO block
    (id, hash, author, state_root, parent_hash, extrinsic_root, finalized, timestamp)
  VALUES
    %L
  ON CONFLICT (id) DO UPDATE SET
    author = EXCLUDED.author,
    finalized = EXCLUDED.finalized,
    timestamp = EXCLUDED.timestamp,
    state_root = EXCLUDED.state_root,
    parent_hash = EXCLUDED.parent_hash,
    extrinsic_root = EXCLUDED.extrinsic_root,
    hash = EXCLUDED.hash;
`, data.map(blockValuesStatement));

export const updateBlockFinalized = async (fromID: number, toID: number) => query(
  `UPDATE block SET finalized = true WHERE id >= ${fromID} AND id < ${toID};`,
);

export const deleteUnfinishedBlocks = async () => query('DELETE FROM block WHERE finalized = false;');

interface BlockHashDB {
  hash: string;
}
export const retrieveBlockHash = async (id: number): Promise<BlockHashDB|undefined> => {
  const result = await queryv2<BlockHashDB>(`SELECT hash FROM block WHERE id = $1;`, [id]);
  if (result.length === 0) { return; }
  return result[0];
};

export const removeBlockWithId = async (id: number): Promise<void> => {
  await queryv2(`DELETE FROM block WHERE id = $1;`, [id]);
}