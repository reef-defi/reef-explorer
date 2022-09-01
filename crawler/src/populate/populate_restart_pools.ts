import { queryv2 } from '../utils/connector';
import logger from '../utils/logger';

const main = async () => {
  logger.info('Removing candlestick data');
  await queryv2('DELETE FROM candlestick WHERE id >= 0;');

  logger.info('Removing volume data');
  await queryv2('DELETE FROM volume_raw WHERE id >= 0;');

  logger.info('Removing reserved data');
  await queryv2('DELETE FROM reserved_raw WHERE id >= 0;');

  logger.info('Removing price data');
  await queryv2('DELETE FROM token_price WHERE id >= 0;');

  logger.info('Removing pool token data');
  await queryv2('DELETE FROM pool_token WHERE id >= 0;');

  logger.info('Removing pool event data');
  await queryv2('DELETE FROM pool_event WHERE id >= 0;');

  logger.info('Removing pool data');
  await queryv2('DELETE FROM pool WHERE id >= 0;');  

  logger.info('Reseting pool sequencer');
  await queryv2('ALTER SEQUENCE pool_event_sequence RESTART WITH 1;')
};

main()
  .then(() => process.exit())
  .catch((err) => logger.error(err));
