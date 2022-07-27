import { createWorker } from "celery-node";
import { nodeProvider, queryv2 } from "./utils/connector";
import logger from "./utils/logger";
import config from './config'
import { deleteUnfinishedBlocks, insertBlock, updateBlockFinalized } from "./queries/block";
import { promiseWithTimeout, toChecksumAddress } from "./utils/utils";
import * as Sentry from '@sentry/node'
import { RewriteFrames } from "@sentry/integrations";
import processBlock from "./crawlerv2/block";
import { AccountBody, Block } from "./crawler/types";
import type { BlockHash } from '@polkadot/types/interfaces/chain';
import { Account } from "./crawlerv2/types";

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
Sentry.setTag('component', 'io-worker');
Sentry.setTag('network', config.network);

console.warn = () => {};

const brokerUrl = `amqp://rabbit:${config.rabbitPort}`;
const worker = createWorker(brokerUrl, brokerUrl);


const blockBody = async (id: number, hash: BlockHash): Promise<Block> => {
  const provider = nodeProvider.getProvider();
  const [signedBlock, extendedHeader, events] = await Promise.all([
    provider.api.rpc.chain.getBlock(hash),
    provider.api.derive.chain.getHeader(hash),
    provider.api.query.system.events.at(hash),
  ]);

  // Parse the timestamp from the `timestamp.set` extrinsic
  const firstExtrinsic = signedBlock.block.extrinsics[0];

  let timestamp;
  if (
    firstExtrinsic
    && firstExtrinsic.method.section === 'timestamp'
    && firstExtrinsic.method.method === 'set'
  ) {
    timestamp = new Date(Number(firstExtrinsic.method.args)).toUTCString();
  } else {
    timestamp = await provider.api.query.timestamp.now.at(hash);
    timestamp = new Date(timestamp.toJSON()).toUTCString();
  }

  return {
    id,
    hash,
    signedBlock,
    extendedHeader,
    events,
    timestamp,
  };
};


const waitForBlockToFinish = async (id: number): Promise<void> => {
  let res = await queryv2<{id: number}>('SELECT id FROM block WHERE id = $1 AND finalized = true;', [id]);
  while (res.length === 0) {
    res = await queryv2<{id: number}>('SELECT id FROM block WHERE id = $1 AND finalized = true;', [id]);
  }
};

const accountInfo = async (address: string): Promise<Account> => {
  const [evmAddress, balances, identity] = await Promise.all([
    nodeProvider.query((provider) => provider.api.query.evmAccounts.evmAddresses(address)),
    nodeProvider.query((provider) => provider.api.derive.balances.all(address)),
    nodeProvider.query((provider) => provider.api.derive.accounts.identity(address)),
  ]);

  const addr = evmAddress.toString();
  const evmAddr = addr !== ''
    ? toChecksumAddress(addr)
    : addr;

  const evmNonce: string | null = addr !== ''
    ? await nodeProvider.query((provider) => provider.api.query.evm.accounts(addr))
      .then((res): any => res.toJSON())
      .then((res) => res?.nonce || 0)
    : 0;

  return {
    address,
    evmNonce,
    active: true,
    evmAddress: evmAddr,
    freeBalance: balances.freeBalance.toString(),
    lockedBalance: balances.lockedBalance.toString(),
    availableBalance: balances.availableBalance.toString(),
    vestedBalance: balances.vestedBalance.toString(),
    votingBalance: balances.votingBalance.toString(),
    reservedBalance: balances.reservedBalance.toString(),
    identity: JSON.stringify(identity),
    nonce: balances.accountNonce.toString(),
  };
}

worker.register('subscribe.to-finalized-block', waitForBlockToFinish);

worker.register('query.block-body', blockBody);
worker.register('query.account-info', accountInfo);



Promise.resolve()
  .then(async () => {
    await nodeProvider.initializeProviders();
    await worker.start();
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
  });;