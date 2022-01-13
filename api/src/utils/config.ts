const toNumber = (defaultValue: number, value?: string): number => {
  if (!value) {
    return defaultValue;
  }
  return parseInt(value, 10);
};

export default {
  httpPort: toNumber(3000, process.env.PORT),
  nodeWs: process.env.NODE_URL || 'ws://0.0.0.0:9944',
  recaptchaSecret: process.env.RECAPTCHA_SECRET || '',

  postgresConfig: {
    port: toNumber(54321, process.env.POSTGRES_PORT),
    host: process.env.POSTGRES_HOST || '0.0.0.0',
    user: process.env.POSTGRES_USER || 'reefexplorer',
    database: process.env.POSTGRES_DATABASE || 'reefexplorer',
    password: process.env.POSTGRES_PASSWORD || 'reefexplorer',
  },
};
