import { Staking } from "../crawler/types";
import { queryv2 } from "../utils/connector";


interface StakingEvent {
  timestamp: string;
  id: number;
  block_id: number;
  data: [string, string];
}

const main = async () => {
  const stakingEvents = await queryv2<StakingEvent>(`SELECT timestamp, id, data FROM event WHERE method = 'Reward' OR method = 'Rewarded';`)
    .then((res) => res.map((s): Staking => ({
      amount: s.data[1],
      blockId: s.block_id,
      eventId: s.id,
      signer: s.data[0],
      timestamp: s.timestamp,
      type: 'Reward'
    })));

  console.log(stakingEvents);
};

main()
  .then(() => console.log('Complete!'))
  .catch((err) => console.error(err));
