import { utils } from 'ethers';
import logger from '../../utils/logger';
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
    logger.info(`Mint event processed! \n\tSender: ${this.sender_address} \n\tAmount1: ${this.amount_1} \n\tAmount2: ${this.amount_2}`);
  }
}

export default MintEvent;
