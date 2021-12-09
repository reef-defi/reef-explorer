

const toNumber = (defaultValue: number, value?: string): number => {
  if (!value) {
    return defaultValue;
  }
  return parseInt(value, 10);
}

console.log("---->", process.env.NODE_PROVIDER_URLS)

export const APP_CONFIG = {
  nodeUrls: JSON.parse(process.env.NODE_PROVIDER_URLS || "[\"ws://0.0.0.0:9944\"]"),
  startBlockSize: toNumber(32, process.env.START_BLOCK_SIZE),
  maxBlocksPerStep: toNumber(1024, process.env.MAX_BLOCKS_PER_STEP),

  postgresConfig: {
    host: process.env.POSTGRES_HOST || '0.0.0.0',
    port: toNumber(54321, process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER || 'reefexplorer',
    database: process.env.POSTGRES_DATABASE || 'reefexplorer',
    password: process.env.POSTGRES_PASSWORD || 'reefexplorer',
  }
}