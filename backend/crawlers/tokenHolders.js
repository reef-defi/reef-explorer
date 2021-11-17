// @ts-check
const pino = require('pino');
const {
  wait,
  getClient,
  getProviderAPI,
  isNodeSynced,
  dbQuery,
  updateTokenHolders,
} = require('../lib/utils');
const backendConfig = require('../backend.config');
const erc20Abi = require('../assets/erc20Abi.json');

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
  const provider = await getProviderAPI(loggerOptions);

  let synced = await isNodeSynced(provider.api, loggerOptions);
  while (!synced) {
    // eslint-disable-next-line no-await-in-loop
    await wait(10000);
    // eslint-disable-next-line no-await-in-loop
    synced = await isNodeSynced(provider.api, loggerOptions);
  }

  const [
    { block },
    timestampMs,
  ] = await Promise.all([
    provider.api.rpc.chain.getBlock(),
    provider.api.query.timestamp.now(),
  ]);
  const timestamp = Math.floor(parseInt(timestampMs.toString(), 10) / 1000);
  const blockHeight = block.header.number.toString();

  const startTime = new Date().getTime();

  // Get all claimed evm addresses and their associated account id
  const accountsQuery = 'SELECT account_id, evm_address FROM account WHERE evm_address != \'\';';
  const accounts = await dbQuery(client, accountsQuery, loggerOptions);

  // Get tokens
  const tokensQuery = 'SELECT e.contract_id, e.name, e.symbol FROM contract as c INNER JOIN erc20 as e ON c.contract_id = e.contract_id;'
  const tokens = await dbQuery(client, tokensQuery, loggerOptions);

  // eslint-disable-next-line no-restricted-syntax
  for (const token of tokens.rows) {
    logger.info(loggerOptions, `Processing token ${token.token_name} (${token.contract_id})`);
    await updateTokenHolders(client, provider, token.contract_id, erc20Abi, accounts, blockHeight, timestamp, loggerOptions);
  }

  logger.debug(loggerOptions, 'Disconnecting from API');
  await provider.api.disconnect().catch((error) => logger.error(loggerOptions, `API disconnect error: ${JSON.stringify(error)}`));

  logger.debug(loggerOptions, 'Disconnecting from DB');
  await client.end().catch((error) => logger.error(loggerOptions, `DB disconnect error: ${JSON.stringify(error)}`));

  const endTime = new Date().getTime();
  logger.info(loggerOptions, `Processed ${tokens.rows.length} tokens and ${accounts.rows.length} accounts in ${((endTime - startTime) / 1000).toFixed(0)}s`);

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
