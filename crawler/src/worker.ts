import { createWorker } from "celery-node";
import { nodeProvider } from "./utils/connector";
import logger from "./utils/logger";
import config from './config'
import { deleteUnfinishedBlocks } from "./queries/block";
import { promiseWithTimeout } from "./utils/utils";
import * as Sentry from '@sentry/node'
import { RewriteFrames } from "@sentry/integrations";
import processBlock from "./crawlerv2/block";
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

const worker = createWorker('amqp://', 'amqp://');

worker.register('process.block', processBlock);

Promise.resolve()
  .then(async () => {
    await nodeProvider.initializeProviders();
    await worker.start();
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
  });;