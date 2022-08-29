import { queryv2 } from '../utils/connector';
import logger from '../utils/logger';

const main = async () => {
  logger.info('Removing candlestic data');
  await queryv2('DELETE FROM candlestic WHERE id >= 0;');

  logger.info('Removing volume data');
  await queryv2('DELETE FROM volume WHERE id >= 0;');

  logger.info('Removing reserves data');
  await queryv2('DELETE FROM reserves WHERE id >= 0;');

  logger.info('Removing price data');
  await queryv2('DELETE FROM price WHERE id >= 0;');

  logger.info('Removing pool token data');
  await queryv2('DELETE FROM pool_token WHERE id >= 0;');

  logger.info('Removing pool event data');
  await queryv2('DELETE FROM pool_event WHERE id >= 0;');

  logger.info('Removing pool data');
  await queryv2('DELETE FROM pool WHERE id >= 0;');  

  logger.info('Reseting pool sequencer');
  await queryv2('ALTER SEQUENCE pool_event_sequence RESTART WITH 0;')
};

main()
  .then(() => process.exit())
  .catch((err) => logger.error(err));
