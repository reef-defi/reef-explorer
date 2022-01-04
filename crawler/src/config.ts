const toNumber = (defaultValue: number, value?: string): number => {
  if (!value) {
    return defaultValue;
  }
  return parseInt(value, 10);
};

export const APP_CONFIG = {
  nodeUrls: JSON.parse(
    process.env.NODE_PROVIDER_URLS || '["ws://0.0.0.0:9944"]'
  ), //, , \"ws://0.0.0.0:9945\", \"ws://0.0.0.0:9946\", \"ws://0.0.0.0:9947\", \"ws://0.0.0.0:9948\", \"ws://0.0.0.0:9949\", \"ws://0.0.0.0:9950\", \"ws://0.0.0.0:9951\"]
  startBlockSize: toNumber(32, process.env.START_BLOCK_SIZE),
  maxBlocksPerStep: toNumber(1024, process.env.MAX_BLOCKS_PER_STEP),
  chunkSize: toNumber(100, process.env.CHUNK_SIZE),

  postgresConfig: {
    host: process.env.POSTGRES_HOST || "0.0.0.0",
    port: toNumber(54321, process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER || "reefexplorer",
    database: process.env.POSTGRES_DATABASE || "reefexplorer",
    password: process.env.POSTGRES_PASSWORD || "reefexplorer",
  },
};
