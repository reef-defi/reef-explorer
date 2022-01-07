import { EventBody } from '../crawler/types';
import { query } from '../utils/connector';

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
): string => `(${id}, '${data[0]}', ${data[1]}, '${type}', '${timestamp}')`;

export default async (
  events: EventBody[],
  type: StakingType,
): Promise<void> => {
  if (events.length === 0) {
    return;
  }
  await query(`
    INSERT INTO staking
      (event_id, signer, amount, type, timestamp)
    VALUES
      ${events.map((e) => eventToStakingValue(e, type)).join(',\n\t')};
  `);
};
