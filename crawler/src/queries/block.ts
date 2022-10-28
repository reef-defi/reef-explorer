import { insertV2, query, queryv2 } from '../utils/connector';
import logger from '../utils/logger';

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
  // Checking for the first gap that appears in the database
  const gap = await queryv2<BlockID>(
    `SELECT b.id
    FROM block as b
    LEFT JOIN block as b1 on b.id = b1.id - 1
    WHERE b.finalized = true AND b1.id IS NULL
    ORDER by b.id ASC;`,
  );

  if (gap.length > 0) {
    const gapId = parseInt(gap[0].id, 10) - 1;
    logger.info(`Found block gap in database, starting from ${gapId}`);
    return gapId;
  }
  // If there is no gap, return the last finalized block in the database
  const result = await query<BlockID>(
    'SELECT ID FROM block WHERE finalized = true ORDER By id DESC LIMIT 1',
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

export const insertBlock = async (
  data: InsertInitialBlock,
): Promise<void> => insertMultipleBlocks([data]);

export const updateBlocksFinalized = async (fromID: number, toID: number) => query(
  `UPDATE block SET finalized = true WHERE id >= ${fromID} AND id < ${toID};`,
);
export const updateBlockFinalized = async (id: number) => query(
  `UPDATE block SET finalized = true WHERE id = ${id};`,
);

export const deleteUnfinishedBlocks = async () => query('DELETE FROM block WHERE finalized = false;');

interface BlockHashDB {
  hash: string;
}
export const retrieveBlockHash = async (id: number): Promise<BlockHashDB|undefined> => {
  const result = await queryv2<BlockHashDB>('SELECT hash FROM block WHERE id = $1;', [id]);
  return result.length > 0 ? result[0] : undefined;
};

export const removeBlockWithId = async (id: number): Promise<void> => {
  await queryv2('DELETE FROM block WHERE id = $1;', [id]);
};
