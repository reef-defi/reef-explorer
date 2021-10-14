// @ts-check
require('dotenv').config();
module.exports = {
  recaptchaSecret: process.env.RECAPTCHA_SECRET || '',
  httpPort: process.env.PORT || 8000,
  nodeWs: 'ws://substrate-node:9944',
  postgresConnParams: {
    user: process.env.POSTGRES_USER || 'reefexplorer',
    host: process.env.POSTGRES_HOST || 'postgres',
    database: process.env.POSTGRES_DATABASE || 'reefexplorer',
    password: process.env.POSTGRES_PASSWORD || 'reefexplorer',
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  },
};
