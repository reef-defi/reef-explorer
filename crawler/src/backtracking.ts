import * as Sentry from '@sentry/node';
import { RewriteFrames } from '@sentry/integrations';
import { nodeProvider, queryv2 } from './utils/connector';
import logger from './utils/logger';
import config from './config';
import { wait } from './utils/utils';
import backtractContractEvents from './backtracking/';

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
Sentry.setTag('component', 'backtracking');
Sentry.setTag('network', config.network);

interface Address {
  address: string;
}

const backtrackEvents = async () => {
  while (true) {
    // Get contract from newly verificated contract table
    const contracts = await queryv2<Address>('SELECT address FROM newly_verified_contract_queue');

    for (let contractIndex = 0; contractIndex < contracts.length; contractIndex += 1) {
      // Process contract events & store them
      const { address } = contracts[contractIndex];
      await backtractContractEvents(address);
      await queryv2('DELETE FROM newly_verified_contract_queue WHERE address = $1;', [address]);
    }

    await wait(1000);
  }
};

Promise.resolve()
  .then(async () => {
    await nodeProvider.initializeProviders();
  })
  .then(backtrackEvents)
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
