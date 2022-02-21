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
});

const getFirstQueryValue = async <T,>(statement: string, args = [] as any[]): Promise<T> => {
  const res = await queryv2<T>(statement, args);
  if (res.length === 0) {
    throw new Error(`Query was empty: \n\t${statement}\narguments: \n\t ${args}`);
  }
  return res[0];
}

const poolEvents = async () => {
  let nextEvmEvent = await getFirstQueryValue<number>('SELECT next_val(pool_event_serail_id);');

  while (true) {
    const event = await queryv2<any>('SELECT * FROM evm_event WHERE id = $1;', [nextEvmEvent]);

    if (event.length === 0) { 
      await wait(1000);
      continue;
    }

    await processPoolEvent(event[0]);
    nextEvmEvent = await getFirstQueryValue<number>('SELECT next_val(pool_event_serail_id);');
  }
};


Promise.resolve()
  .then(async () => {
    await nodeProvider.initializeProviders();
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
    process.exit(-1);
  });
