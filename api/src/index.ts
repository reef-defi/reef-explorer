import * as Sentry from '@sentry/node';
import { RewriteFrames } from '@sentry/integrations';
import express, { Response } from 'express';
import morgan from 'morgan';
import config from './utils/config';
import accountRouter from './routes/account';
import contractRouter from './routes/contract';
import verificationRouter from './routes/verification';
import { getLastBlock, getReefPrice } from './services/utils';
import { errorStatus } from './utils/utils';
import { getProvider } from './utils/connector';

/* eslint "no-underscore-dangle": "off" */
Sentry.init({
  dsn: config.sentryDns,
  tracesSampleRate: 1.0,
  integrations: [
    new RewriteFrames({
      root: global.__dirname,
    }),
  ],
  environment: config.environment,
});
Sentry.setTag('component', 'api');

const cors = require('cors');

const app = express();

// Parse incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.use('/api', contractRouter);
app.use('/api/account', accountRouter);
app.use('/api/verificator', verificationRouter);

app.get('/api/price/reef', async (_, res: Response) => {
  try {
    const price = await getReefPrice();
    res.send(price);
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
});

app.get('/api/crawler/status', async (_, res: Response) => {
  try {
    const result = await getLastBlock();
    res.send({ ...result });
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
});

// TODO db testing
// app.get('/api/test/erc20-contracts', async (_, res) => {
//   try {
//     const result = await query("SELECT e.contract_id, e.name, e.symbol FROM contract as c INNER JOIN erc20 as e ON c.contract_id = e.contract_id;", []);
//     res.send(result)
//   } catch (err) {
//     console.log(err);
//     res.status(errorStatus(err)).send(err.message);
//   }
// })
// app.get('/api/test/contracts', async (_, res) => {
//   try {
//     const result = await query("SELECT * FROM contract LIMIT 1;", []);
//     res.send(result)
//   } catch (err) {
//     console.log(err);
//     res.status(errorStatus(err)).send(err.message);
//   }
// })
// app.get('/api/test/token-holders', async (_, res) => {
//   try {
//     const result = await query("SELECT contract_id FROM token_holder;", []);
//     res.send(result)
//   } catch (err) {
//     console.log(err);
//     res.status(errorStatus(err)).send(err.message);
//   }
// })
// app.get('/api/test/cvr', async (_, res) => {
//   try {
//     const result = await query("SELECT * FROM contract_verification_request;", []);
//     res.send(result)
//   } catch (err) {
//     console.log(err);
//     res.status(errorStatus(err)).send(err.message);
//   }
// })

app.listen(config.httpPort, async () => {
  await getProvider().api.isReadyOrError;
  console.log(`Reef explorer API is running on port ${config.httpPort}.`);
});
