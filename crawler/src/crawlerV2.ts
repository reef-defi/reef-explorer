import { RewriteFrames } from '@sentry/integrations';
import * as Sentry from '@sentry/node';
import config from './config';
import processBlock from './crawlerv2/block';
import { deleteUnfinishedBlocks, lastBlockInDatabase } from './queries/block';
import { nodeProvider, queryv2 } from './utils/connector';
import logger from './utils/logger';
import Performance from './utils/Performance';
import Queue from './utils/Queue';
import { promiseWithTimeout, wait } from './utils/utils';
// Importing @sentry/tracing patches the global hub for tracing to work.
// import * as Tracing from "@sentry/tracing";

/* eslint "no-underscore-dangle": "off" */
Sentry.init({
  dsn: config.sentryDns,
  tracesSampleRate: 1.0,
  integrations: [
    new RewriteFrames({
      root: global.__dirname,
    }),
  ],
  environment: config.environment,
});
Sentry.setTag('component', 'crawler');
Sentry.setTag('network', config.network);

console.warn = () => {};


const MAX_LEN = 100;

const crawler = async () => {
  let currentBlockIndex = await lastBlockInDatabase();
  currentBlockIndex++;
  let queue = new Queue<Promise<void>>(MAX_LEN);
  let per = new Performance(MAX_LEN);

  while(true) {
    while(currentBlockIndex <= nodeProvider.lastFinalizedBlockId() && !queue.isFull()) {
      queue.push(processBlock(currentBlockIndex));
      currentBlockIndex++;
    }
    if (queue.isEmpty()) {
      await wait(config.pollInterval);
      continue 
    }
    
    const start = Date.now();
    await queue.pop();
    const diff = Date.now() - start;
    per.push(diff);
    per.log();
  }
};

Promise.resolve()
  .then(async () => {
    await nodeProvider.initializeProviders();
  })
  .then(async () => {
    logger.info('Removing unfinished blocks...');
    await deleteUnfinishedBlocks();

    await queryv2('DELETE FROM block WHERE id > 1');
    logger.info('...success');
  })
  .then(() => {
    logger.info(`Contract verification sync: ${config.verifiedContractSync}`);
  })
  .then(crawler)
  .then(async () => {
    await nodeProvider.closeProviders();
    logger.info('Finished');
    process.exit();
  })
  .catch(async (error) => {
    logger.error(error);
    // Sentry.captureException(error);

    try {
      await promiseWithTimeout(nodeProvider.closeProviders(), 200, Error('Failed to close proivders!'));
    } catch (err) {
      // Sentry.captureException(err);
    }

    logger.error('Finished');
    Sentry.close(2000).then(() => {
      process.exit(-1);
    });
  });
