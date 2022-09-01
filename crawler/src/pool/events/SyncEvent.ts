import { utils } from "ethers";
import { queryv2 } from "../../utils/connector";
import PoolEvent, { PoolEventData } from "./PoolEvent";

class SyncEvent extends PoolEvent {
  constructor(poolEvent: PoolEventData) {
    super(poolEvent, 'Sync');
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);

    this.reserved_1 = event.args[0].toString();
    this.reserved_2 = event.args[1].toString();
  }

  async save(): Promise<void> {
    await super.save();

    await queryv2(
      `INSERT INTO reserved_raw
        (block_id, pool_id, reserved_1, reserved_2, timestamp)
      VALUES
        ($1, $2, $3, $4, $5);`,
        [this.blockId, this.poolId, this.reserved_1, this.reserved_2, this.timestamp]
    )
  }
}

export default SyncEvent;