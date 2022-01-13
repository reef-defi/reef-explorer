import { insert, query } from '../utils/connector';

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
}: InsertInitialBlock): string => `(${id}, '${hash}', '${author}', '${stateRoot}', '${parentHash}', '${extrinsicRoot}', false, '${timestamp}')`;

export const insertMultipleBlocks = async (
  data: InsertInitialBlock[],
): Promise<void> => insert(`
INSERT INTO block
    (id, hash, author, state_root, parent_hash, extrinsic_root, finalized, timestamp)
  VALUES
    ${data.map(blockValuesStatement).join(',\n')}
  ON CONFLICT DO NOTHING;
`);

// TODO use insert multiple blocks!
export const insertInitialBlock = async (
  data: InsertInitialBlock,
): Promise<void> => insertMultipleBlocks([data]);

export const updateBlockFinalized = async (fromID: number, toID: number) => query(
  `UPDATE block SET finalized = true WHERE id >= ${fromID} AND id < ${toID};`,
);

export const deleteUnfinishedBlocks = async () => query('DELETE FROM block WHERE finalized = false;');
