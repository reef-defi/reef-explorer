import { EventBody } from '../crawler/types';
import { insertV2, nodeProvider } from '../utils/connector';
import logger from '../utils/logger';
import {Option} from "@polkadot/types"
import { resolvePromisesAsChunks } from '../utils/utils';
type StakingType = 'Slash' | 'Reward';

const eventToStakingValue = (
  {
    id,
    event: {
      event: { data },
    },
    timestamp,
  }: EventBody,
  type: StakingType,
): any[] => [id, data[0].toString(), data[1].toString(), type, timestamp];

export const stakingEra = async () => {
  // const {data} = event.event.event;
  // const eraIndex = data[0].toString();
  const eraIndex = 333; 
  console.log(eraIndex);
  logger.info("Extracting era staking rewards");
  const stakers = await nodeProvider.query((provider) => provider.api.query.staking.erasRewardPoints(eraIndex))

  const rewards = await resolvePromisesAsChunks(
    Array.from(stakers.individual.keys())
      .map(async (addr) => {
        const address = addr.toString()
        const reward = await nodeProvider.query((provider) => provider.api.query.staking.erasStakers(eraIndex, address));
        return {
          address,
          amount: reward.own.toString()
        }
      }
      )
  );
  // const sa = await nodeProvider.getProvider().api.query.staking.erasStakers(322, null)
  // console.log(sa.toJSON());
  // console.log(stakers.toHuman())
  console.log(rewards);
  // console.log(stakers);
  // stakers.forEach((s) => {
  //   console.log(s.era.toJSON())
  //   console.log(s.eraReward.toJSON())
  //   console.log("")
  // })
}

export default async (
  events: EventBody[],
  type: StakingType,
): Promise<void> => insertV2(
  `INSERT INTO staking
    (event_id, signer, amount, type, timestamp)
  VALUES
    %L;`, 
  events.map((e) => eventToStakingValue(e, type))
);