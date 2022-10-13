import { utils } from 'ethers';
import PoolEvent, { PoolEventData } from './PoolEvent';

class MintEvent extends PoolEvent {
  constructor(poolEvent: PoolEventData) {
    super(poolEvent, 'Mint');
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);
    const [address, amount0, amount1] = event.args;
    this.sender_address = address;
    this.amount_1 = amount0.toString();
    this.amount_2 = amount1.toString();
  }
}

export default MintEvent;
