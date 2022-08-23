import * as Sentry from '@sentry/node';
import { RewriteFrames } from '@sentry/integrations';
import { nodeProvider, queryv2 } from './utils/connector';
import logger from './utils/logger';
import config from './config';
import { wait } from './utils/utils';
import processPoolEvent from './pool/';
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

const poolEvents = async () => {
  let currentEvmEventPointer = await findInitialIndex();

  while (true) {
    // If evm event does not exist wait for one second and retry
    if (await checkIfEventExists(currentEvmEventPointer)) {
      // process evm evnt pointer
      await processPoolEvent(currentEvmEventPointer);
      currentEvmEventPointer = await getNextPoolPointer();
    } else if (await isCurrentPointerInGap(currentEvmEventPointer)) {
      currentEvmEventPointer = await getNextPoolPointer();
    } else {
      await wait(1000);
    }
  }
};


const removeAllPoolEventsAboveBlock = async (blockId: string) => {
  // Removing all pool data above current block
  await queryv2(`DELETE FROM candlestic WHERE block_id >= $1;`, [blockId]);
  await queryv2(`DELETE FROM reserved WHERE block_id >= $1;`, [blockId]);
  await queryv2(`DELETE FROM price WHERE block_id >= $1;`, [blockId]);
  await queryv2(`DELETE FROM pool_token WHERE block_id >= $1;`, [blockId]);
  await queryv2(`DELETE FROM volume WHERE block_id >= $1;`, [blockId]);

  // Remove pool events
  await queryv2(
    `DELETE event
    FROM pool_event as event
    JOIN evm_event as ev ON event.evm_event_id = ev.id
    WHERE ev.block_id >= $1;`,
    [blockId]
  );

  // Remove pools
  await queryv2(
    `DELETE pool
    FROM pool
    JOIN evm_event as ev ON pool.evm_event_id = ev.id
    WHERE ev.block_id >= $1;`,
    [blockId]
  );
};

const poolProcess = async () => {
  // Find the last processed block 
  const currentBlock = await getCurrentPoolPointer();

  // Remove all pool rows that are greater then current pool pointer  
  await removeAllPoolEventsAboveBlock(currentBlock)


  // Insert select previous values from candlestic, reserved, token price, pool token data and volume

  // Check if block has pool evm event in it, if yes process it

  // Calculate new token prices if block has pool evm event


}

Promise.resolve()
  .then(async () => {
    await nodeProvider.initializeProviders();
    logger.info(`Factory address used: ${config.reefswapFactoryAddress}`);
  })
  .then(poolEvents)
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
