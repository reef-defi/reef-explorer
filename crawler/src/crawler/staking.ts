import {
  AccountHead, NeededStakingValues, Staking, StakingInsert,
} from './types';
import { insertV2, nodeProvider } from '../utils/connector';
import logger from '../utils/logger';

const stakingToInsert = (staking: Staking): StakingInsert => [
  staking.eventId,
  staking.signer,
  staking.amount,
  staking.type,
  staking.timestamp,
];

export const stakingToAccount = ({ signer, blockId, timestamp }: Staking): AccountHead => ({
  blockId,
  timestamp,
  active: true,
  address: signer,
});

export const processStakingEvent = async <T extends NeededStakingValues, > ({
  id, data, timestamp, blockId,
}: T): Promise<Staking> => {
  let signer = data[0];
  const amount = data[1];

  // Retrieving block hash to extract correct reward destination mapping
  const blockHash = await nodeProvider.query(
    (provider) => provider.api.rpc.chain.getBlockHash(blockId),
  );
  // Retrieving reward destination mapping for specific block and user
  const rewardDestination = await nodeProvider.query(
    (provider) => provider.api.query.staking.payee.at(blockHash, signer),
  );

  // If account has speficied different reward destination we switch the staking signer to that one
  if (rewardDestination.isAccount) {
    logger.info(`Redirecting staking rewards from: ${signer} to: ${rewardDestination.asAccount.toString()}`);
    signer = rewardDestination.asAccount.toString();
  }

  return {
    amount,
    signer,
    blockId,
    timestamp,
    eventId: id,
    type: 'Reward',
  };
};

export const insertStaking = async (stakingRewards: Staking[]): Promise<void> => insertV2(
  `INSERT INTO staking
    (event_id, signer, amount, type, timestamp)
  VALUES
    %L;`,
  stakingRewards.map(stakingToInsert),
);
