import type { BlockHash } from '@polkadot/types/interfaces/chain';
import { Block } from '../crawler/types';
import { insertBlock, updateBlockFinalized } from '../queries/block';
import { nodeProvider, queryv2 } from '../utils/connector';
import logger from '../utils/logger';
import resolveEvent from './extrinsic/event';
import DefaultEvent from './extrinsic/event/DefaultEvent';
import Extrinsic from './extrinsic/Extrinsic';
import AccountManager from './managers/AccountManager';

type EventMap = {[extrinsicId: number]: DefaultEvent[]};

const blockBody = async (id: number, hash: BlockHash): Promise<Block> => {
  const provider = nodeProvider.getProvider();
  const [signedBlock, extendedHeader, events] = await Promise.all([
    provider.api.rpc.chain.getBlock(hash),
    provider.api.derive.chain.getHeader(hash),
    provider.api.query.system.events.at(hash),
  ]);

  // Parse the timestamp from the `timestamp.set` extrinsic
  const firstExtrinsic = signedBlock.block.extrinsics[0];

  let timestamp;
  if (
    firstExtrinsic
    && firstExtrinsic.method.section === 'timestamp'
    && firstExtrinsic.method.method === 'set'
  ) {
    timestamp = new Date(Number(firstExtrinsic.method.args)).toUTCString();
  } else {
    timestamp = await provider.api.query.timestamp.now.at(hash);
    timestamp = new Date(timestamp.toJSON()).toUTCString();
  }

  return {
    id,
    hash,
    signedBlock,
    extendedHeader,
    events,
    timestamp,
  };
};

const reduceExtrinsicEvents = (acc: EventMap, event: DefaultEvent): EventMap => {
  if (event.head.event.phase.isApplyExtrinsic) {
    const eventExtrinsic = event.head.event.phase.asApplyExtrinsic.toNumber();

    if (!acc[eventExtrinsic]) {
      acc[eventExtrinsic] = [];
    }

    acc[eventExtrinsic].push(event);
  }

  return acc;
};

const formateBlockBody = ({
  id,
  hash,
  extendedHeader,
  signedBlock,
  timestamp,
}: Block) => ({
  id,
  timestamp,
  finalized: false,
  hash: hash.toString(),
  author: extendedHeader?.author?.toString() || '',
  parentHash: signedBlock.block.header.parentHash.toString(),
  stateRoot: signedBlock.block.header.stateRoot.toString(),
  extrinsicRoot: signedBlock.block.header.extrinsicsRoot.toString(),
});

const formatUnfinalizedBlock = (id: number, hash: BlockHash) => ({
  id,
  finalized: false,
  hash: hash.toString(),
  timestamp: `${new Date().toUTCString()}`,
  author: '',
  parentHash: '',
  stateRoot: '',
  extrinsicRoot: '',
});

const waitForBlockToFinish = async (id: number): Promise<void> => {
  let res = await queryv2<{id: number}>('SELECT id FROM block WHERE id = $1 AND finalized = true;', [id]);
  while (res.length === 0) {
    res = await queryv2<{id: number}>('SELECT id FROM block WHERE id = $1 AND finalized = true;', [id]);
  }
};

export const processUnfinalizedBlock = async (
  id: number,
) => {
  logger.info(`New unfinalized head detected ${id}`);
  const hash = await nodeProvider.query((provider) => provider.api.rpc.chain.getBlockHash(id));

  // Insert blocks
  logger.info('Inserting unfinalized block');
  await insertBlock(formatUnfinalizedBlock(id, hash));
};

const checkIfBlockIsFinalized = async (id: number): Promise<boolean> => {
  const res = await queryv2<{id: number}>('SELECT id FROM block WHERE id = $1 AND finalized = true;', [id]);
  return res.length > 0;
};

const processBlock = async (blockId: number): Promise<void> => {
  // Skip if block is already finalized
  if (await checkIfBlockIsFinalized(blockId)) {
    return;
  }

  logger.info('--------------------------------');
  // Load block hash
  logger.info(`Loading block hash for: ${blockId}`);
  const hash = await nodeProvider.query((provider) => provider.api.rpc.chain.getBlockHash(blockId));

  // Load block
  logger.info(`Loading block for: ${blockId}`);
  const block = await blockBody(blockId, hash);

  // Inserting initial block and marking it as unfinalized
  logger.info(`Inserting unfinalized block: ${blockId}`);
  await insertBlock(formateBlockBody(block));

  // Storing events for each extrinsic
  logger.info('Resolving events & mapping them to extrinsic');
  const events = await Promise.all(block.events.map(async (event, index) => resolveEvent({
    blockId,
    event,
    index,
    timestamp: block.timestamp,
  })));
  const mappedEvents = events.reduce(reduceExtrinsicEvents, {});
  const accountManager = new AccountManager(blockId, block.timestamp);

  logger.info('Resolving extrinsics');
  const extrinsics = block.signedBlock.block.extrinsics.map((extr, index) => new Extrinsic(
    blockId,
    index,
    block.timestamp,
    extr,
    mappedEvents[index],
  ));

  logger.info('Processing extrinsics & events');
  await Promise.all(extrinsics.map(async (extrinisc) => extrinisc.process(accountManager)));

  // logger.info('Waiting for the previous block to finish');
  // await waitForBlockToFinish(blockId - 1);

  // First saving all used accounts
  await accountManager.save();

  // Chain saving all extrinsic and events
  logger.info('Saving extrinsic & their events');
  await Promise.all(extrinsics.map(async (extrinisc) => extrinisc.save()));

  // Updating block finalization
  logger.info(`Finalizing block ${blockId}`);
  await updateBlockFinalized(blockId);
};

export default processBlock;
