const toNumber = (defaultValue: number, value?: string): number => {
  if (!value) {
    return defaultValue;
  }
  return parseInt(value, 10);
};

const defaultNodeUrls = [
  'ws://0.0.0.0:9944',
];

export default {
  nodeUrls: process.env.NODE_PROVIDER_URLS ? JSON.parse(process.env.NODE_PROVIDER_URLS) as string[] : defaultNodeUrls,
  startBlockSize: toNumber(32, process.env.START_BLOCK_SIZE),
  maxBlocksPerStep: toNumber(256, process.env.MAX_BLOCKS_PER_STEP),
  chunkSize: toNumber(1024, process.env.CHUNK_SIZE),
  pollInterval: toNumber(100, process.env.POLL_INTERVAL),
  sentryDns: process.env.SENTRY_DNS || '',
  sentryBacktrackingDns: process.env.SENTRY_DNS || '',
  environment: process.env.ENVIRONMENT,
  reefswapFactoryAddress: process.env.FACTORY_ADDRESS || '',
  network: process.env.NETWORK,

  postgresConfig: {
    host: process.env.POSTGRES_HOST || '0.0.0.0',
    port: toNumber(54321, process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER || 'reefexplorer',
    database: process.env.POSTGRES_DATABASE || 'reefexplorer',
    password: process.env.POSTGRES_PASSWORD || 'reefexplorer',
  },
};
