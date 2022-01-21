import * as Sentry from '@sentry/node';
import { RewriteFrames } from '@sentry/integrations';
import config from './config';
import processBlocks from './crawler/block';
import { deleteUnfinishedBlocks, lastBlockInDatabase } from './queries/block';
import {
  closeProviders,
  getLastBlockId,
  initializeProviders,
} from './utils/connector';
import { min, wait } from './utils/utils';
import logger from './utils/logger';
// Importing @sentry/tracing patches the global hub for tracing to work.
// import * as Tracing from "@sentry/tracing";

/* eslint "no-underscore-dangle": "off" */
Sentry.init({
  dsn: 'https://b297f1e10e8040f693bbc66c9696f5d9@sentry.ilol.si/6', // TODO put this out! process.env.SENTRY_DSN
  tracesSampleRate: 1.0,
  integrations: [
    new RewriteFrames({
      root: global.__dirname,
    }),
  ],
});

let BLOCKS_PER_STEP = config.startBlockSize;
let currentBlockIndex = -1;

console.warn = () => {};

const processNextBlock = async () => {
  while (true) {
    const chainHead = getLastBlockId();

    while (currentBlockIndex < chainHead) {
      const difference = min(chainHead - currentBlockIndex, BLOCKS_PER_STEP);
      const from = currentBlockIndex + 1;
      const to = from + difference;

      const start = Date.now();
      const transactions = await processBlocks(from, to);
      currentBlockIndex = to - 1;
      const ms = Date.now() - start;
      const time = ms / 1000;
      const bps = difference / time;

      logger.info(
        `n nodes: ${
          config.nodeUrls.length
        }\tn blocks: ${difference}\tbps: ${bps.toFixed(
          3,
        )}\tn transactions: ${transactions}\ttps: ${(transactions / time).toFixed(
          3,
        )}\ttime: ${time.toFixed(3)} s\tblock from ${from} to ${to}`,
      );
      BLOCKS_PER_STEP = min(BLOCKS_PER_STEP * 2, config.maxBlocksPerStep);
    }

    await wait(config.pollInterval);
  }
};

Promise.resolve()
  .then(initializeProviders)
  .then(async () => {
    logger.info('Removing unfinished blocks...');
    await deleteUnfinishedBlocks();
    logger.info('...success');
  })
  .then(async () => {
    currentBlockIndex = await lastBlockInDatabase();
  })
  .then(processNextBlock)
  .catch((error) => {
    logger.error(error);
    Sentry.captureException(error);
    process.exit(-1);
  })
  .finally(closeProviders);
