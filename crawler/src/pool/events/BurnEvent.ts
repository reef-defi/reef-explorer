import PoolEvent from "./PoolEvent";
import { utils } from "ethers";

class BurnEvent extends PoolEvent {
  constructor(poolId: string, eventId: string, timestamp: string) {
    super(poolId, eventId, timestamp, 'Burn');
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);
    this.sender_address = event.args[0];
    this.amount_1 = event.args[1].toString();
    this.amount_2 = event.args[2].toString();
    this.to_address = event.args[3];
  }
}

export default BurnEvent;