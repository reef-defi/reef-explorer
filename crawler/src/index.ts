import { APP_CONFIG } from "./config";
import { processBlocks } from "./crawler/block";
import { deleteUnfinishedBlocks, lastBlockInDatabase } from "./queries/block";
import {
  closeProviders,
  initializeProviders,
  lastBlockId,
} from "./utils/connector";
import { min, wait } from "./utils/utils";
import * as Sentry from "@sentry/node";
import { RewriteFrames } from "@sentry/integrations";
import { logger } from "./utils/logger";
// Importing @sentry/tracing patches the global hub for tracing to work.
// import * as Tracing from "@sentry/tracing";

Sentry.init({
  dsn: "https://b297f1e10e8040f693bbc66c9696f5d9@sentry.ilol.si/6", //TODO put this out! process.env.SENTRY_DSN
  tracesSampleRate: 1.0,
  integrations: [
    new RewriteFrames({
      root: global.__dirname,
    }),
  ],
});

let BLOCKS_PER_STEP = APP_CONFIG.startBlockSize;
let currentBlockIndex = -1;

console.warn = () => {};

const processNextBlock = async () => {
  while (currentBlockIndex < lastBlockId) {
    const difference = min(lastBlockId - currentBlockIndex, BLOCKS_PER_STEP);
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
        APP_CONFIG.nodeUrls.length
      }\tn blocks: ${difference}\tbps: ${bps.toFixed(
        3
      )}\tn transactions: ${transactions}\ttps: ${(transactions / time).toFixed(
        3
      )}\ttime: ${time.toFixed(3)} s\tblock from ${from} to ${to}`
    );
    BLOCKS_PER_STEP = min(BLOCKS_PER_STEP * 2, APP_CONFIG.maxBlocksPerStep);
  }

  await wait(100);
  await processNextBlock();
};

Promise.resolve()
  .then(initializeProviders)
  .then(deleteUnfinishedBlocks)
  .then(async () => {
    currentBlockIndex = await lastBlockInDatabase();
  })
  .then(processNextBlock)
  .catch((error) => {
    console.error(error);
    Sentry.captureException(error);
    process.exit(-1);
  })
  .finally(closeProviders);
