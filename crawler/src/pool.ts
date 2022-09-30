import { RewriteFrames } from '@sentry/integrations';
import * as Sentry from '@sentry/node';
import config from './config';
import { processPoolBlock } from './pool/';
import FactoryEvent from './pool/events/FactoryEvent';
import MarketHistory from './pool/historyModules';
import { verifyPools } from './pool/events/poolVerification';
import { nodeProvider, queryv2 } from './utils/connector';
import logger from './utils/logger';
import { wait } from './utils/utils';


/* eslint "no-underscore-dangle": "off" */
Sentry.init({
  dsn: config.sentryBacktrackingDns,
  tracesSampleRate: 1.0,
  integrations: [
    new RewriteFrames({
      root: global.__dirname,
    }),
  ],
  environment: config.environment,
});
Sentry.setTag('component', 'pools');
Sentry.setTag('network', config.network);

const getFirstQueryValue = async <T, >(statement: string, args = [] as any[]): Promise<T> => {
  const res = await queryv2<T>(statement, args);
  if (res.length === 0) {
    throw new Error(`Query was empty: \n\t${statement}\narguments: \n\t ${args}`);
  }
  return res[0];
};

const getCurrentPoolPointer = async (): Promise<string> => getFirstQueryValue<{currval: string}>(
  'SELECT last_value as currval FROM pool_event_sequence'
  )
  .then((res) => res.currval);

const getNextPoolPointer = async (): Promise<string> => await getFirstQueryValue<{nextval: string}>(
    'SELECT nextval(\'pool_event_sequence\');'
  )
  .then((res) => res.nextval);

const removeAllPoolEventsAboveBlock = async (blockId: string) => {
  // Removing all pool data above current block
  await queryv2(`DELETE FROM candlestick WHERE block_id >= $1;`, [blockId]);
  await queryv2(`DELETE FROM reserved_raw WHERE block_id >= $1;`, [blockId]);
  await queryv2(`DELETE FROM token_price WHERE block_id >= $1;`, [blockId]);
  await queryv2(`DELETE FROM volume_raw WHERE block_id >= $1;`, [blockId]);

  // Remove pool events
  await queryv2(
    `DELETE FROM pool_event as e
    USING evm_event as evm
    WHERE evm.block_id >= $1 AND e.evm_event_id = evm.id;`,
    [blockId]
  );

  // Remove pools
  await queryv2(
    `DELETE FROM pool
    USING evm_event as evm
    WHERE evm.block_id >= $1 AND pool.evm_event_id = evm.id;`,
    [blockId]
  );
};


const awaitBlock = async (blockId: string): Promise<string> => {
  while (true) {
    const result = await queryv2<{timestamp: string}>('SELECT timestamp FROM block WHERE id = $1 AND finalized = true;', [blockId]);
    if (result.length > 0) {
      return result[0].timestamp;
    }
    await wait(100);
  }
};

const poolProcess = async () => {
  // Find the last processed block 
  let currentBlock = await getCurrentPoolPointer();

  // Remove all pool rows that are greater then current pool pointer  
  await removeAllPoolEventsAboveBlock(currentBlock)

  // Initialize token prices on previous block
  const previousBlock = (parseInt(currentBlock, 10)-1).toString() 
  await MarketHistory.init(previousBlock);

  while (true) {
    // Awaiting block is finalized
    const blockTimestamp = await awaitBlock(currentBlock);

    // Starting to verify pools after certain block
    if (currentBlock === `${config.poolVerificationAfterBlock}`) {
      // Trigger pool verification for all existing pools
      await verifyPools();
      // Allowing facotry events to verify new pools
      FactoryEvent.verify = true;
    }

    // Process block events
    await processPoolBlock(currentBlock);
    
    // Update token prices and insert new values
    await MarketHistory.save(currentBlock, blockTimestamp);
   
    // Get next block
    currentBlock = await getNextPoolPointer();
  }
}

Promise.resolve()
  .then(async () => {
    await nodeProvider.initializeProviders();
    logger.info(`Factory address used: ${config.reefswapFactoryAddress}`);
    logger.info(`Pool verification after block: ${config.poolVerificationAfterBlock}`);
  })
  .then(poolProcess)
  .then(async () => {
    await nodeProvider.closeProviders();
    logger.info('Finished');
    process.exit();
  })
  .catch(async (error) => {
    logger.error(error);
    Sentry.captureException(error);
    await nodeProvider.closeProviders();
    logger.error('Finished');
    Sentry
      .close(2000)
      .then(() => process.exit(-1));
  });
