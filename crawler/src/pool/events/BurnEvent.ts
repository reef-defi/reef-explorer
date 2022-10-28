import { utils } from 'ethers';
import logger from '../../utils/logger';
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
    logger.info(`Burn event processed! \n\tSender: ${this.sender_address} \n\tAmount1: ${this.amount_1} \n\tAmount2: ${this.amount_2} \n\tTo: ${this.to_address}`);
  }
}

export default BurnEvent;
