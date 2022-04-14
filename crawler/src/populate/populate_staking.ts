import { BigNumber } from 'ethers';
import { accountHeadToBody } from '../crawler/event';
import { insertStaking, processStakingEvent, stakingToAccount } from '../crawler/staking';
import { NeededStakingValues, Staking } from '../crawler/types';
import { insertAccounts } from '../queries/event';
import { nodeProvider, queryv2 } from '../utils/connector';
import logger from '../utils/logger';
import { dropDuplicates, resolvePromisesAsChunks } from '../utils/utils';

interface StakingEvent {
  id: number;
  block_id: number;
  extrinsic_id: number;
  timestamp: string;
  data: [string, string];
}

const main = async () => {
  await nodeProvider.initializeProviders();

  logger.info('Removing staking data');
  await queryv2('DELETE FROM staking WHERE id > 0;');

  logger.info('Loading staking events');
  /* eslint-disable camelcase */
  const stakingEvents = await queryv2<StakingEvent>('SELECT * FROM event WHERE method = \'Reward\' OR method = \'Rewarded\';')
    .then((res) => res.map(({
      id, block_id, data: [address, amount], timestamp,
    }): NeededStakingValues => ({
      id,
      blockId: block_id,
      data: [address, BigNumber.from(amount).toString()],
      timestamp: new Date(timestamp).toISOString(),
    })));

  const stakingEventsLength = stakingEvents.length;
  logger.info(`There are ${stakingEventsLength} staking events`);

  logger.info('Processing staking events and extracting reward destination mapping');
  const staking: Staking[] = [];
  /* eslint-disable no-plusplus */
  for (let index = 0; index < stakingEventsLength; index++) {
    if (index % 100 === 0) {
      /* eslint-disable no-mixed-operators */
      logger.info(`Current processing index: ${index}, current percentage: ${(index / stakingEventsLength * 100).toFixed(2)} %`);
    }
    staking.push(await processStakingEvent(stakingEvents[index]));
  }

  logger.info('Updating account balances');
  const accountHeaders = dropDuplicates(
    staking.map(stakingToAccount),
    'address',
  );

  logger.info('Loading account balances');
  const accounts = await resolvePromisesAsChunks(
    accountHeaders.map(accountHeadToBody),
  );

  logger.info('Inserting accounts');
  await insertAccounts(accounts);

  logger.info('Inserting staking');
  await insertStaking(staking);

  logger.info('Complete!');
};

main()
  .then(() => process.exit())
  .catch((err) => logger.error(err));
