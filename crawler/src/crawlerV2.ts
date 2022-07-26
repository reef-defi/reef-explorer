import { RewriteFrames } from '@sentry/integrations';
import * as Sentry from '@sentry/node';
import config from './config';
import processBlock, { processUnfinalizedBlock } from './crawlerv2/block';
import { deleteUnfinishedBlocks, lastBlockInDatabase } from './queries/block';
import { nodeProvider } from './utils/connector';
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

const crawler = async () => {
  let currentBlockIndex = await lastBlockInDatabase();
  currentBlockIndex++;
  const queue = new Queue<Promise<void>>(config.maxBlocksPerStep);
  const per = new Performance(config.maxBlocksPerStep);

  nodeProvider.getProvider().api.rpc.chain.subscribeNewHeads(async (header) => {
    await processUnfinalizedBlock(header.number.toNumber());
  });

  while (true) {
    // Starting to process some amount of blocks
    while (currentBlockIndex <= nodeProvider.lastFinalizedBlockId() && !queue.isFull()) {
      queue.push(processBlock(currentBlockIndex));
      currentBlockIndex++;
    }

    // If queue is empty crawler has nothing to do
    if (queue.isEmpty()) {
      await wait(config.pollInterval);
      continue;
    }

    // Waiting for the first block to finish and measuring performance
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
    logger.info('Removing unfinished blocks...');
    await deleteUnfinishedBlocks();
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
    Sentry.captureException(error);

    try {
      await promiseWithTimeout(nodeProvider.closeProviders(), 200, Error('Failed to close proivders!'));
    } catch (err) {
      Sentry.captureException(err);
    }

    logger.error('Finished');
    Sentry.close(2000).then(() => {
      process.exit(-1);
    });
  });
