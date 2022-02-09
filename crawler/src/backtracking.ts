import { nodeProvider, queryv2 } from "./utils/connector";
import logger from "./utils/logger";
import * as Sentry from '@sentry/node';
import { RewriteFrames } from '@sentry/integrations';
import config from "./config";
import { wait } from "./utils/utils";
import backtractContractEvents from "./backtracking/";

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

interface Address {
  address: string;
}

const backtrackEvents = async () => {
  while (true) { 
    // Get contract from newly verificated contract table
    const contracts = await queryv2<Address>("SELECT address FROM newly_verified_contract");

    for (const {address} of contracts) {
      // Process contract events & store them
      await backtractContractEvents(address)
    }
    
    // Remove contract from newly verificated contract table
    await queryv2('DELETE FROM newly_verified_contract WHERE address IN $1;', [
      `[${contracts.map(({address}) => address).join(", ")}]`
    ]);
    
    await wait(1000);
  }
}

Promise.resolve()
  .then(async () => {
    await nodeProvider.initializeProviders();
  })
  .then(backtrackEvents)
  .catch((error) => {
    logger.error(error);
    Sentry.captureException(error);
  })
  .finally(async () => {
    await nodeProvider.closeProviders()
    process.exit(-1);
  });
