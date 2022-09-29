import { utils } from "ethers";
import Volume from "../historyModules/Volume";
import PoolEvent, { PoolEventData } from "./PoolEvent";

class SwapEvent extends PoolEvent {
  constructor(poolEvent: PoolEventData) {
    super(poolEvent, 'Swap');
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);

    this.sender_address = event.args[0];
    this.amount_in_1 = event.args[1].toString();
    this.amount_in_2 = event.args[2].toString();
    this.amount_1 = event.args[3].toString() as string;
    this.amount_2 = event.args[4].toString() as string;
    this.to_address = event.args[5];

    Volume.updateVolume(this.poolId, this.amount_1, this.amount_2);
  }
}

export default SwapEvent;