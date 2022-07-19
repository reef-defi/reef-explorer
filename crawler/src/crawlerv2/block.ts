import { extrinsicStatus } from "../crawler/extrinsic";
import { Block, BlockHash, Event } from "../crawler/types";
import { insertBlock, updateBlockFinalized } from "../queries/block";
import { nodeProvider } from "../utils/connector";
import logger from "../utils/logger";
import resolveEvent from "./extrinsic/event";
import DefaultEvent from "./extrinsic/event/DefaultEvent";
import Extrinsic from "./extrinsic/Extrinsic";
import AccountManager from "./managers/AccountManager";

type EventMap = {[extrinsicId: number]: DefaultEvent[]};


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

const reduceExtrinsicEvents = (acc: EventMap, event: DefaultEvent): EventMap => {
  const eventExtrinsic = event.head.event.phase.asApplyExtrinsic.toNumber();
  if (!acc[eventExtrinsic]) {
    acc[eventExtrinsic] = [];
  }
  acc[eventExtrinsic].push(event)
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
  logger.info('Resolving events & mapping them to extrinsic');
  const events = await Promise.all(block.events.map(async (event, index) => resolveEvent({
    blockId,
    event,
    index,
    timestamp: block.timestamp,
  })))
  const mappedEvents = events.reduce(reduceExtrinsicEvents, {});

  const accountManager = new AccountManager(blockId, block.timestamp);

  logger.info('Resolving extrinsics');
  const extrinsics = block.signedBlock.block.extrinsics.map((extr, index) => new Extrinsic(
    blockId,
    index,
    block.timestamp,
    extr,
    mappedEvents[index]
  ));

  logger.info('Processing extrinsics & events');
  await Promise.all(extrinsics.map(async (extrinisc) => extrinisc.process(accountManager)));

  // TODO subscribe to the db block with block id - 1 and await block finalization!

  // First saving all used accounts
  logger.info('Updating used accounts')
  await accountManager.save();

  // Chain saving all extrinsic and events
  logger.info('Saving extrinsic & their events');
  await Promise.all(extrinsics.map(async (extrinisc) => extrinisc.save()));

  // Updating block finalization
  logger.info(`Finalizing block ${blockId}`)
  await updateBlockFinalized(blockId);
};

export default processBlock;