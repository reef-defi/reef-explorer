import { utils } from "ethers";
import PoolEvent from "./PoolEvent";

class SwapEvent extends PoolEvent {
  constructor(poolId: string, eventId: string, timestamp: string) {
    super(poolId, eventId, timestamp, 'Swap');
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);

    this.sender_address = event.args[0];
    this.amount_in_1 = event.args[1].toString();
    this.amount_in_2 = event.args[2].toString();
    this.amount_1 = event.args[3].toString();
    this.amount_2 = event.args[4].toString();
    this.to_address = event.args[5];
  }
}

export default SwapEvent;