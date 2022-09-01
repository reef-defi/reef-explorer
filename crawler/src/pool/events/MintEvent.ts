import { utils } from "ethers";
import PoolEvent, { PoolEventData } from "./PoolEvent";

class MintEvent extends PoolEvent {
  constructor(poolEvent: PoolEventData) {
    super(poolEvent, 'Mint');
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);
    this.sender_address = event.args[0];
    this.amount_1 = event.args[1].toString();
    this.amount_2 = event.args[2].toString();
  }
}

export default MintEvent;