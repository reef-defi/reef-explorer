import { AccountHead, EventBody } from './types';
import { insertV2, nodeProvider } from '../utils/connector';
import logger from '../utils/logger';

type StakingType = 'Slash' | 'Reward';

type EventId = number;
type Signer = string;
type Amount = string;
type Timestamp = string;

type StakingInsert = [EventId, Signer, Amount, StakingType, Timestamp];

interface ValidatorReward {
  signer: string;
  amount: string;
}

interface Staking extends ValidatorReward {
  blockId: number;
  eventId: EventId;
  type: StakingType;
  timestamp: Timestamp;
}

const stakingToInsert = (staking: Staking): StakingInsert => [
  staking.eventId,
  staking.signer,
  staking.amount,
  staking.type,
  staking.timestamp
];

export const stakingToAccount = ({signer, blockId, timestamp}: Staking): AccountHead => ({
  blockId,
  timestamp, 
  active: true,
  address: signer,
});

export const processStakingEvent = async ({id, event, timestamp, blockId}: EventBody): Promise<Staking> => {
  const {data} = event.event;
  const [addr, amount] = data;
  let signer = addr.toString();

  logger.info(`Extracting era validator: ${signer} staking reward`)
 
  const blockHash = await nodeProvider.query(
    (provider) => provider.api.rpc.chain.getBlockHash(blockId)
  );
  const rewardDestination = await nodeProvider.query(
    (provider) => provider.api.query.staking.payee.at(blockHash, "5CDo1enKQhb7EXYh91yfANuxRS7VdEfuHb8SxQRvw173jpPd")
  );
  
  if (rewardDestination.isAccount) {
    signer = rewardDestination.asAccount.toString();
    console.log(signer);
  }

  return {
    signer,
    blockId,
    timestamp,
    eventId: id,
    type: 'Reward',
    amount: amount.toString(),
  };
}

export const insertStaking = async (stakingRewards: Staking[]): Promise<void> => insertV2(
  `INSERT INTO staking
    (event_id, signer, amount, type, timestamp)
  VALUES
    %L;`, 
  stakingRewards.map(stakingToInsert)
);