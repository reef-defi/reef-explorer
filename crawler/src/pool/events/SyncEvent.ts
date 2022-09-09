import { utils } from "ethers";
import BigNumber from "bignumber.js";
import TokenPrices from "../historyModules/TokenPrices";
import { queryv2 } from "../../utils/connector";
import PoolEvent, { PoolEventData } from "./PoolEvent";
import Reserves from "../historyModules/Reserves";

interface PoolInfo {
  token_1: string;
  token_2: string;
  decimal_1: number;
  decimal_2: number;
}
const queryPool = async (poolId: string): Promise<PoolInfo> => 
  queryv2<PoolInfo>("SELECT token_1, token_2, decimal_1, decimal_2 FROM pool WHERE id = $1", [poolId])
    .then((res) => res[0]);

class SyncEvent extends PoolEvent {
  constructor(poolEvent: PoolEventData) {
    super(poolEvent, 'Sync');
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);

    const {token_1, token_2, decimal_1, decimal_2} = await queryPool(this.poolId);

    this.reserved_1 = event.args[0].toString();
    this.reserved_2 = event.args[1].toString();

    if (!this.reserved_1 || !this.reserved_2) {
      throw new Error(`Sync event on evm event: ${this.evmEventId} has no reserve`);
    }

    // Update reserves for tokens in TokenPrices
    TokenPrices.updateReserves(
      token_1,
      token_2,
      new BigNumber(this.reserved_1).div(new BigNumber(10).pow(decimal_1)),
      new BigNumber(this.reserved_2).div(new BigNumber(10).pow(decimal_2))
    );
    Reserves.updateReserve(
      this.poolId,
      this.evmEventId,
      new BigNumber(this.reserved_1),
      new BigNumber(this.reserved_2)
    );
  }

  async save(): Promise<void> {
    await super.save();

    await queryv2(
      `INSERT INTO reserved_raw
        (block_id, pool_id, evm_event_id, reserved_1, reserved_2, timestamp)
      VALUES
        ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (block_id, pool_id) DO UPDATE SET
        reserved_1 = EXCLUDED.reserved_1,
        reserved_2 = EXCLUDED.reserved_2;`,
        [this.blockId, this.poolId, this.evmEventId, this.reserved_1, this.reserved_2, this.timestamp]
    )
  }
}

export default SyncEvent;