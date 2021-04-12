require('dotenv').config();

module.exports = {
  substrateNetwork: process.env.SUBSTRATE_NETWORK || 'reef',
  wsProviderUrl: process.env.WS_PROVIDER_URL || 'ws://substrate-node:9944',
  postgresConnParams: {
    user: process.env.POSTGRES_USER || 'reef',
    host: process.env.POSTGRES_HOST || 'postgres',
    database: process.env.POSTGRES_DATABASE || 'reef',
    password: process.env.POSTGRES_PASSWORD || 'reef',
    port: process.env.POSTGRES_PORT || 5432,
  },
  crawlers: [
    {
      enabled: !process.env.CRAWLER_BLOCK_LISTENER_DISABLE,
      // eslint-disable-next-line global-require
      module: require('./src/crawlers/blockListener'),
    },
    {
      enabled: !process.env.CRAWLER_BLOCK_HARVESTER_DISABLE,
      // eslint-disable-next-line global-require
      module: require('./src/crawlers/blockHarvester'),
      config: {
        startDelay: 60 * 1000,
        pollingTime:
          parseInt(process.env.CRAWLER_BLOCK_LISTENER_POLLING_TIME_MS, 10)
          || 60 * 60 * 1000,
      },
    },
    {
      enabled: !process.env.CRAWLER_ACTIVE_ACCOUNTS_DISABLE,
      // eslint-disable-next-line global-require
      module: require('./src/crawlers/activeAccounts'),
      config: {
        startDelay: 30 * 1000,
        pollingTime:
          parseInt(process.env.CRAWLER_ACTIVE_ACCOUNTS_POLLING_TIME_MS, 10)
          || 30 * 60 * 1000,
      },
    },
  ],
};
