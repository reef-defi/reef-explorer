import { EventBody } from './types';
import { insertV2, nodeProvider } from '../utils/connector';
import logger from '../utils/logger';
import { resolvePromisesAsChunks } from '../utils/utils';
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

const eventToStaking = (event: EventBody, type: StakingType): Staking => ({
  type,
  eventId: event.id,
  timestamp: event.timestamp,
  signer: event.event.event.data[0].toString(),
  amount: event.event.event.data[1].toString(),
});

const insertStaking = async (stakingRewards: StakingInsert[]): Promise<void> => insertV2(
  `INSERT INTO staking
    (event_id, signer, amount, type, timestamp)
  VALUES
    %L;`, 
  stakingRewards
); 

const stakingEra = async ({id, event, timestamp}: EventBody): Promise<Staking> => {
  const {data} = event.event;
  const eraIndex = data[0].toString();
  const signer = data[1].toString();

  logger.info(`Extracting era validator: ${signer} staking reward`)
  const amount = await nodeProvider.query((provider) => provider.api.query.staking.erasStakers(eraIndex, signer))

  return {
    signer,
    timestamp,
    eventId: id,
    type: 'Reward',
    amount: amount.toString(),
  };
}

export const stakingEras = async (events: EventBody[]): Promise<void> => {
  const staking = await resolvePromisesAsChunks(events.map(stakingEra));
  await insertStaking(staking.map(stakingToInsert));
}

export const stakingRewards = async (
  events: EventBody[],
  type: StakingType,
): Promise<void> => insertStaking(
  events
    .map((e) => eventToStaking(e, type))
    .map(stakingToInsert)
);