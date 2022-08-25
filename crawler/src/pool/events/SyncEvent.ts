import { utils } from "ethers";
import PoolEvent from "./PoolEvent";

class SyncEvent extends PoolEvent {
  constructor(poolId: string, eventId: string, timestamp: string) {
    super(poolId, eventId, timestamp, 'Sync');
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);

    this.reserved_1 = event.args[0].toString();
    this.reserved_2 = event.args[1].toString();
  }
}

export default SyncEvent;