import BigNumber from "bignumber.js";
import { insertV2 } from "../../utils/connector";
import logger from "../../utils/logger";
import MarketHistoryModule from "./MarketHistoryModule";
import { queryReservedData } from "./utils";

type Reserve = [BigNumber, BigNumber, string|null];

class Reserves implements MarketHistoryModule {
  private static pools: string[] = [];
  private static reserves: Reserve[] = [];

  static async init(blockId: string): Promise<void> {
    logger.info("Initializing Resrves holder on block: " + blockId);
    this.pools = [];
    this.reserves = [];

    const reserves = await queryReservedData(blockId); 

    for (const {id, evm_event_id, reserved_1, reserved_2} of reserves) {
      this.updateReserve(
        ""+id,
        evm_event_id === null ? null : ""+evm_event_id,
        new BigNumber(reserved_1),
        new BigNumber(reserved_2)
      );
    }
    console.log(this.pools);
    console.log(this.reserves);
  }

  static updateReserve(poolId: string, evmEventId: string|null, reserve1: BigNumber, reserve2: BigNumber): void {
    const index = this.pools.indexOf(poolId);
    if (index !== -1) {
      logger.info(`Reserves detected new pool: ${poolId}`)
      this.pools.push(poolId);
      this.reserves.push([reserve1, reserve2, evmEventId]);
    } else {
      logger.info(`Reserves updated for pool: ${poolId}`)
      this.reserves[index] = [reserve1, reserve2, evmEventId];
    }
  }
  static async save(blockId: string, timestamp: string): Promise<void> {
    await insertV2(
      `INSERT INTO reserved_raw
        (block_id, pool_id, evm_event_id, reserved_1, reserved_2, timestamp)
      VALUES
        %L;`,
      this.pools.map((poolId, index) => [
        blockId,
        poolId,
        this.reserves[index][2],
        this.reserves[index][0].toString(),
        this.reserves[index][1].toString(),
        timestamp,
      ])
    )
  }
}

export default Reserves;