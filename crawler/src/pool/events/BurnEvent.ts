import { utils } from 'ethers';
import PoolEvent, { PoolEventData } from './PoolEvent';

class BurnEvent extends PoolEvent {
  constructor(poolEvent: PoolEventData) {
    super(poolEvent, 'Burn');
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);
    const [address, amount1, amount2, to] = event.args;
    this.sender_address = address;
    this.amount_1 = amount1.toString();
    this.amount_2 = amount2.toString();
    this.to_address = to;
  }
}

export default BurnEvent;
