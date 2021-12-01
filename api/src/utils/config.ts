export const APP_CONFIGURATION = {
  recaptchaSecret: process.env.RECAPTCHA_SECRET || '',
  httpPort: process.env.PORT || 3000,
  // nodeWs: 'ws://substrate-node:9944',
  nodeWs: 'ws://127.0.0.1:9944',
  postgresConfig: {
    port: 54321,
    host: '0.0.0.0',
    user: process.env.POSTGRES_USER || 'reefexplorer',
    // host: process.env.POSTGRES_HOST || 'postgres',
    database: process.env.POSTGRES_DATABASE || 'reefexplorer',
    password: process.env.POSTGRES_PASSWORD || 'reefexplorer',
    // port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  }
}