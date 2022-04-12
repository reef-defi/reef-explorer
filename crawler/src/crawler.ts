import * as Sentry from '@sentry/node';
import { RewriteFrames } from '@sentry/integrations';
import config from './config';
import processBlocks, { processInitialBlocks } from './crawler/block';
import { deleteUnfinishedBlocks, lastBlockInDatabase } from './queries/block';
import { nodeProvider } from './utils/connector';
import { min, promiseWithTimeout, wait } from './utils/utils';
import logger from './utils/logger';
import parseAndInsertSubContracts from './crawler/contracts';
import syncVerifiedContracts from './crawler/syncVerifiedContracts';
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

const processNextBlock = async () => {
  let BLOCKS_PER_STEP = config.startBlockSize;
  let currentBlockIndex = await lastBlockInDatabase();
  let updateSubContractsCounter = 0;
  let updateVerifiedContracts = 0;

  while (true) {
    const chainHead = nodeProvider.lastBlockId();
    const finalizedHead = nodeProvider.lastFinalizedBlockId();

    while (currentBlockIndex < finalizedHead) {
      const difference = min(chainHead - currentBlockIndex, BLOCKS_PER_STEP);
      const finalizedDifference = min(finalizedHead - currentBlockIndex, BLOCKS_PER_STEP);

      const from = currentBlockIndex + 1;
      const to = from + finalizedDifference;

      const start = Date.now();

      let transactions = 0;
      nodeProvider.setDbBlockId(from + difference - 1);
      // // Processing unfinalized blocks
      transactions += await processInitialBlocks(to, from + difference);

      // Processing finalized blocks
      transactions += await processBlocks(from, to);

      currentBlockIndex = to - 1;
      const ms = Date.now() - start;
      const time = ms / 1000;
      const bps = finalizedDifference / time;

      logger.info(
        `n nodes: ${
          config.nodeUrls.length
        }\tn blocks: ${finalizedDifference}\tbps: ${bps.toFixed(
          3,
        )}\tn transactions: ${transactions}\ttps: ${(transactions / time).toFixed(
          3,
        )}\ttime: ${time.toFixed(3)} s\tblock from ${from} to ${to}`,
      );
      BLOCKS_PER_STEP = min(BLOCKS_PER_STEP * 2, config.maxBlocksPerStep);
    }

    // Missing Contracts - Inefficient pattern
    updateSubContractsCounter += 1;
    if (updateSubContractsCounter > config.subcontractInterval) {
      await parseAndInsertSubContracts(finalizedHead);
      updateSubContractsCounter = 0;
    }

    /**
     * Verification contract sync will only be triggered when:
     * - sync is enabled
     * - crawler is in "listening" mode
     * - on every nth interval
     */
    updateVerifiedContracts += 1;
    if (
      config.verifiedContractSync
      && (finalizedHead - currentBlockIndex) <= 3
      && updateVerifiedContracts > config.verifiedContractSyncInterval
    ) {
      await syncVerifiedContracts();
      updateVerifiedContracts = 0;
    }

    await wait(config.pollInterval);
  }
};

Promise.resolve()
  .then(async () => {
    await nodeProvider.initializeProviders();
  })
  .then(async () => {
    logger.info('Removing unfinished blocks...');
    await deleteUnfinishedBlocks();
    logger.info('...success');
  })
  .then(() => {
    logger.info(`Contract verification sync: ${config.verifiedContractSync}`);
  })
  .then(processNextBlock)
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
