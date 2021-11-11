// @ts-check
require('dotenv').config();

module.exports = {
  substrateNetwork: process.env.SUBSTRATE_NETWORK || 'reefexplorer',
  wsProviderUrl: process.env.WS_PROVIDER_URL || 'ws://substrate-node:9944',
  // wsProviderUrl: 'ws://127.0.0.1:9944',
  postgresConnParams: {
    user: process.env.POSTGRES_USER || 'reefexplorer',
    host: process.env.POSTGRES_HOST || 'postgres',
    // host: '0.0.0.0',
    database: process.env.POSTGRES_DATABASE || 'reefexplorer',
    password: process.env.POSTGRES_PASSWORD || 'reefexplorer',
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  },
  logLevel: process.env.LOG_LEVEL || 'info', // Use 'debug' to see DEBUG level messages
  crawlers: [
    {
      name: 'blockListener',
      enabled: !process.env.BLOCK_LISTENER_DISABLE,
      crawler: './crawlers/blockListener.js',
    },
    {
      name: 'blockHarvester',
      enabled: !process.env.BLOCK_HARVESTER_DISABLE,
      crawler: './crawlers/blockHarvester.js',
      startDelay: parseInt(process.env.BLOCK_HARVESTER_START_DELAY_MS, 10) || 10 * 1000,
      mode: process.env.BLOCK_HARVESTER_MODE || 'chunks',
      chunkSize: parseInt(process.env.BLOCK_HARVESTER_CHUNK_SIZE, 10) || 10,
      statsPrecision: parseInt(process.env.BLOCK_HARVESTER_STATS_PRECISION, 10) || 2,
      pollingTime:
        parseInt(process.env.BLOCK_LISTENER_POLLING_TIME_MS, 10)
        || 60 * 60 * 1000,
    },
    {
      name: 'ranking',
      enabled: !process.env.RANKING_DISABLE,
      crawler: './crawlers/ranking.js',
      startDelay: parseInt(process.env.RANKING_START_DELAY_MS, 10) || 15 * 60 * 1000,
      pollingTime:
        parseInt(process.env.RANKING_POLLING_TIME_MS, 10)
        || 5 * 60 * 1000,
      historySize: 84,
      erasPerDay: 1,
      tokenDecimals: 18,
    },
    {
      name: 'activeAccounts',
      enabled: !process.env.ACTIVE_ACCOUNTS_DISABLE,
      crawler: './crawlers/activeAccounts.js',
      startDelay: parseInt(process.env.ACTIVE_ACCOUNTS_START_DELAY_MS, 10) || 60 * 1000,
      chunkSize: parseInt(process.env.ACTIVE_ACCOUNTS_CHUNK_SIZE, 10) || 100,
      pollingTime:
        parseInt(process.env.ACTIVE_ACCOUNTS_POLLING_TIME_MS, 10)
        || 6 * 60 * 60 * 1000, // 6 hours
    },
    {
      name: 'tokenHolders',
      enabled: !process.env.TOKEN_HOLDERS_DISABLE,
      crawler: './crawlers/tokenHolders.js',
      startDelay: parseInt(process.env.TOKEN_HOLDERS_START_DELAY_MS, 10) || 2 * 60 * 1000,
      pollingTime:
        parseInt(process.env.TOKEN_HOLDERS_POLLING_TIME_MS, 10)
        || 10 * 60 * 1000, // 10 min
    },
  ],
};
