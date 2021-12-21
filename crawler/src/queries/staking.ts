import { EventBody } from "../crawler/types";
import { query } from "../utils/connector";

const eventToStakingSlashValue = ({id, event: {event: {data}}}: EventBody): string => 
  `(${id}, '${data[0]}', ${data[1]}, 'Slash')`

const eventToStakingRewardValue = ({id, event: {event: {data}}}: EventBody): string => 
  `(${id}, '${data[0]}', ${data[1]}, 'Reward')`

export const insertStakingSlash = async (events: EventBody[]): Promise<void> => {
  if (events.length === 0) { return; }
  await query(`
    INSERT INTO staking
      (event_id, account, amount, type)
    VALUES
      ${events.map(eventToStakingSlashValue).join(",\n\t")};
  `);
};

export const insertStakingReward = async (events: EventBody[]): Promise<void> => {
  if (events.length === 0) { return; }
  await query(`
    INSERT INTO staking
      (event_id, account, amount, type)
    VALUES
      ${events.map(eventToStakingRewardValue).join(",\n\t")};
  `);
}