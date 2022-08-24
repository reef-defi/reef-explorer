import { utils } from "ethers";
import DefaultPoolEvent from "./DefaultPoolEvent";

class SyncEvent extends DefaultPoolEvent {
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