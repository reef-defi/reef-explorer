import { extrinsicStatus } from "../crawler/extrinsic";
import { Block, BlockHash, Event, EventHead } from "../crawler/types";
import { insertBlock, insertMultipleBlocks, updateBlockFinalized, updateBlocksFinalized } from "../queries/block";
import { nodeProvider } from "../utils/connector";
import logger from "../utils/logger";
import AccountManager from "./managers/AccountManager";
import resolveExtrinsic from "./extrinsic";

type EventMap = {[extrinsicId: number]: Event[]};


const blockBody = async ({ id, hash }: BlockHash): Promise<Block> => {
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

const reduceExtrinsicEvents = (acc: EventMap, event: Event): EventMap => {
  const eventExtrinsic = event.phase.asApplyExtrinsic.toNumber();
  if (!acc[eventExtrinsic]) {
    acc[eventExtrinsic] = [];
  }
  acc[eventExtrinsic].push()
  return acc;
}

const blockBodyToInsert = ({
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

const processBlock = async (blockId: number): Promise<void> => {
  // Load block hash
  logger.info(`Loading block hash for: ${blockId}`)
  const hash = await nodeProvider.query((provider) => provider.api.rpc.chain.getBlockHash(blockId));
  
  // Load block
  logger.info(`Loading block for: ${blockId}`)
  const block = await blockBody({id: blockId, hash});

  // Inserting initial block and marking it as unfinalized
  logger.info(`Inserting unfinalized block: ${blockId}`)
  await insertBlock(blockBodyToInsert(block));

  // Storing events for each extrinsic
  logger.info('Mapping events to extrinsic');
  const mappedEvents = block.events.reduce(reduceExtrinsicEvents, {});

  const accountManager = new AccountManager(blockId, block.timestamp);

  logger.info('Resolving extrinsics & events');
  const extrinsics = await Promise.all(
    block.signedBlock.block.extrinsics.map(async (extr, index) => 
      resolveExtrinsic(
        {
          blockId,
          index,
          extrinsic: extr,
          timestamp: block.timestamp,
          events: mappedEvents[index],
          status: extrinsicStatus(mappedEvents[index]),
        }
      )
    )
  );
  for (let extrinsic of extrinsics) {
    await extrinsic.process(accountManager);
  }

  // TODO subscribe to the db block with block id - 1 and await block finalization!

  // First saving all used accounts
  logger.info('Updating used accounts')
  await accountManager.save();

  // Chain saving all extrinsic and events
  logger.info('Saving extrinsic & their events');
  for (let extrinsic of extrinsics) {
    await extrinsic.save();
  }

  // Updating block finalization
  logger.info(`Finalizing block ${blockId}`)
  await updateBlockFinalized(blockId);
};

export default processBlock;