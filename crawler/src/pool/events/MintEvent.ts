import { utils } from "ethers";
import DefaultPoolEvent from "./DefaultPoolEvent";

class MintEvent extends DefaultPoolEvent {
  constructor(poolId: string, eventId: string, timestamp: string) {
    super(poolId, eventId, timestamp, 'Mint');
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);
    this.sender_address = event.args[0];
    this.amount_1 = event.args[1].toString();
    this.amount_2 = event.args[2].toString();
  }
}

export default MintEvent;