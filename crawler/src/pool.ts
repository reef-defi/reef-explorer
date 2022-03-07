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

const getCurrentPoolPointer = async (): Promise<string> => (await getFirstQueryValue<{currval: string}>('SELECT last_value as currval FROM pool_event_sequence')).currval;

const getNextPoolPointer = async (): Promise<string> => (await getFirstQueryValue<{nextval: string}>('SELECT nextval(\'pool_event_sequence\');')).nextval;

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
