import { utils } from 'ethers';
import Volume from '../historyModules/Volume';
import PoolEvent, { PoolEventData } from './PoolEvent';

class SwapEvent extends PoolEvent {
  constructor(poolEvent: PoolEventData) {
    super(poolEvent, 'Swap');
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);

    const [address, amoin1, amoin2, amo1, amo2, to] = event.args;
    this.sender_address = address;
    this.amount_in_1 = amoin1;
    this.amount_in_2 = amoin2;
    this.amount_1 = amo1.toString() as string;
    this.amount_2 = amo2.toString() as string;
    this.to_address = to;

    Volume.updateVolume(this.poolId, this.amount_1, this.amount_2);
  }
}

export default SwapEvent;
