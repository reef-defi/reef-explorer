import { RewriteFrames } from '@sentry/integrations';
import * as Sentry from '@sentry/node';
import config from './config';
import processPoolEvent, { processPoolBlock } from './pool/';
import MarketHistory from './pool/historyModules';
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

interface ID {
  id: number
}

const findPoolEvent = async (evmEventId: string): Promise<ID[]> => queryv2<ID>('SELECT id FROM pool_event WHERE evm_event_id = $1;', [evmEventId]);

const getCurrentPoolPointer = async (): Promise<string> => getFirstQueryValue<{currval: string}>(
  'SELECT last_value as currval FROM pool_event_sequence'
  )
  .then((res) => res.currval);

const getNextPoolPointer = async (): Promise<string> => await getFirstQueryValue<{nextval: string}>(
    'SELECT nextval(\'pool_event_sequence\');'
  )
  .then((res) => res.nextval);

const checkIfEventExists = async (id: string): Promise<boolean> => {
  const event = await queryv2<unknown>('SELECT id FROM evm_event WHERE id = $1;', [id]);
  return event.length > 0;
};

const checkIfPoolEventExists = async (id: string): Promise<boolean> => {
  const events = await findPoolEvent(id);
  return events.length > 0;
};

const findInitialIndex = async (): Promise<string> => {
  let currentEvmEventPointer = await getCurrentPoolPointer();

  // Initializion with current evm event pointer to make sure last pool event was written in DB
  while (await checkIfPoolEventExists(currentEvmEventPointer)) {
    currentEvmEventPointer = await getNextPoolPointer();
  }

  return currentEvmEventPointer;
};

const isCurrentPointerInGap = async (id: string): Promise<boolean> => {
  const events = await queryv2<unknown>(
    'SELECT id FROM evm_event WHERE id > $1 LIMIT 1;',
    [id],
  );
  return events.length > 0;
};

// const poolEvents = async () => {
//   let currentEvmEventPointer = await findInitialIndex();

//   while (true) {
//     // If evm event does not exist wait for one second and retry
//     if (await checkIfEventExists(currentEvmEventPointer)) {
//       // process evm evnt pointer
//       await processPoolEvent(currentEvmEventPointer);
//       currentEvmEventPointer = await getNextPoolPointer();
//     } else if (await isCurrentPointerInGap(currentEvmEventPointer)) {
//       currentEvmEventPointer = await getNextPoolPointer();
//     } else {
//       await wait(1000);
//     }
//   }
// };


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

const insertPreviousValues = async (currentBlockId: string): Promise<void> => {
  // logger.info(`Inserting previous values in tables: candlestick, reserved_raw, token_price, volume_raw, pool_token for block ${currentBlockId}`);
  // await queryv2(`
  //   INSERT INTO candlestick
  //     (block_id, pool_id, evm_event_id, open, high, low, close, timestamp)
  //     SELECT b.id, c.pool_id, null, c.close, c.close, c.close, c.close, b.timestamp + interval '10' second
  //     FROM candlestick as c
  //     JOIN block as b ON c.block_id + 1 = b.id
  //     WHERE b.id = $1;`,
  //   [currentBlockId]
  // );

  // await queryv2(`
  //   INSERT INTO token_price
  //     (block_id, token_address, price, timestamp)
  //     SELECT b.id, tp.token_address, tp.price, b.timestamp + interval '10' second
  //     FROM token_price as tp
  //     JOIN block as b ON tp.block_id + 1 = b.id
  //     WHERE b.id = $1;`,
  //   [currentBlockId]
  // );

  // logger.info(`Inserting previous reserved raw values for block ${currentBlockId}`);
  // await queryv2(`
  //   INSERT INTO reserved_raw
  //     (block_id, pool_id, evm_event_id, reserved_1, reserved_2, timestamp)
  //     SELECT b.id, r.pool_id, null, r.reserved_1, r.reserved_2, b.timestamp + interval '10' second
  //     FROM reserved_raw as r
  //     JOIN block as b ON r.block_id + 1 = b.id
  //     WHERE b.id = $1;`,
  //   [currentBlockId]
  // );

  // logger.info(`Inserting previous volume raw values for block ${currentBlockId}`);
  // await queryv2(`
  //   INSERT INTO volume_raw
  //     (block_id, pool_id, evm_event_id, volume_1, volume_2, timestamp)
  //     SELECT b.id, v.pool_id, null, 0, 0, b.timestamp + interval '10' second
  //     FROM volume_raw as v
  //     JOIN block as b ON v.block_id + 1 = b.id
  //     WHERE b.id = $1;`,
  //   [currentBlockId]
  // );

  // logger.info(`Inserting previous pool token values for block ${currentBlockId}`);
  // await queryv2(`
  //   INSERT INTO pool_token
  //     (block_id, pool_id, evm_event_id, supply, type, timestamp)
  //     SELECT b.id, pt.pool_id, null, pt.supply, pt.type, b.timestamp + interval '10' second
  //     FROM pool_token as pt
  //     JOIN block as b ON pt.block_id + 1 = b.id
  //     WHERE b.id = $1;`,
  //   [currentBlockId]
  // );
}

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

    // Insert select previous values from candlestick, reserved, token price, pool token data and volume
    await insertPreviousValues(currentBlock);
    
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
