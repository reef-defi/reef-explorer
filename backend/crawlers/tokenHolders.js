// @ts-check
const pino = require('pino');
const { Provider } = require('@reef-defi/evm-provider');
const { WsProvider } = require('@polkadot/api');
// eslint-disable-next-line import/no-extraneous-dependencies
const { ethers } = require('ethers');
const {
  wait,
  getClient,
  getPolkadotAPI,
  isNodeSynced,
  dbQuery,
  dbParamQuery,
} = require('../lib/utils');
const backendConfig = require('../backend.config');

const crawlerName = 'tokenHolders';
const logger = pino({
  level: backendConfig.logLevel,
});
const loggerOptions = {
  crawler: crawlerName,
};
const config = backendConfig.crawlers.find(
  ({ name }) => name === crawlerName,
);

const crawler = async (delayedStart) => {
  if (delayedStart) {
    logger.debug(loggerOptions, `Delaying token holders crawler start for ${config.startDelay / 1000}s`);
    await wait(config.startDelay);
  }

  logger.debug(loggerOptions, 'Running token holders crawler...');

  const client = await getClient(loggerOptions);
  const api = await getPolkadotAPI(loggerOptions);

  let synced = await isNodeSynced(api, loggerOptions);
  while (!synced) {
    // eslint-disable-next-line no-await-in-loop
    await wait(10000);
    // eslint-disable-next-line no-await-in-loop
    synced = await isNodeSynced(api, loggerOptions);
  }

  const provider = new Provider({
    provider: new WsProvider(backendConfig.wsProviderUrl),
  });
  await provider.api.isReady;

  const [
    { block },
    timestampMs,
  ] = await Promise.all([
    api.rpc.chain.getBlock(),
    api.query.timestamp.now(),
  ]);
  const timestamp = Math.floor(timestampMs / 1000);
  const blockHeight = block.header.number.toString();

  const startTime = new Date().getTime();

  // Get all claimed evm addresses and their associated account id
  const accountsQuery = 'SELECT account_id, evm_address FROM account WHERE evm_address != \'\';';
  const accounts = await dbQuery(client, accountsQuery, loggerOptions);

  // Get tokens
  const tokensQuery = 'SELECT contract_id, abi, token_name, token_symbol FROM contract WHERE is_erc20 IS TRUE;';
  const tokens = await dbQuery(client, tokensQuery, loggerOptions);

  // eslint-disable-next-line no-restricted-syntax
  for (const token of tokens.rows) {
    logger.info(loggerOptions, `Processing token ${token.token_name} (${token.contract_id})`);
    const contract = new ethers.Contract(
      token.contract_id,
      JSON.parse(token.abi),
      provider,
    );
    // eslint-disable-next-line no-restricted-syntax
    for (const account of accounts.rows) {
      // eslint-disable-next-line no-await-in-loop
      const balance = await contract.balanceOf(account.evm_address);
      if (balance > 0) {
        // eslint-disable-next-line no-console
        logger.info(loggerOptions, `Holder: ${account.evm_address} (${balance})`);
        // Update token_holder table
        const data = [
          token.contract_id,
          account.account_id,
          account.evm_address,
          balance.toString(),
          blockHeight,
          timestamp,
        ];
        const query = `
          INSERT INTO token_holder (
            contract_id,
            holder_account_id,
            holder_evm_address,
            balance,
            block_height,
            timestamp
          ) VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )
          ON CONFLICT ( contract_id, holder_evm_address )
          DO UPDATE SET
            balance = EXCLUDED.balance,
            block_height = EXCLUDED.block_height,
            timestamp = EXCLUDED.timestamp
          WHERE EXCLUDED.block_height > token_holder.block_height
        ;`;
        // eslint-disable-next-line no-await-in-loop
        await dbParamQuery(client, query, data, loggerOptions);
      } else {
        // Ensure there's no entry in token_holder
        const data = [
          token.contract_id,
          account.evm_address,
        ];
        const query = 'DELETE FROM token_holder WHERE contract_id = $1 AND holder_evm_address = $2;';
        // eslint-disable-next-line no-await-in-loop
        await dbParamQuery(client, query, data, loggerOptions);
      }
    }
  }

  logger.debug(loggerOptions, 'Disconnecting from API');
  await provider.api.disconnect().catch((error) => logger.error(loggerOptions, `API disconnect error: ${JSON.stringify(error)}`));

  logger.debug(loggerOptions, 'Disconnecting from DB');
  await client.end().catch((error) => logger.error(loggerOptions, `DB disconnect error: ${JSON.stringify(error)}`));

  const endTime = new Date().getTime();
  logger.info(loggerOptions, `Processed ${tokens.length} tokens and ${accounts.length} accounts in ${((endTime - startTime) / 1000).toFixed(0)}s`);

  logger.info(loggerOptions, `Next execution in ${(config.pollingTime / 60000).toFixed(0)}m...`);
  setTimeout(
    () => crawler(false),
    config.pollingTime,
  );
};

crawler(true).catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(-1);
});
