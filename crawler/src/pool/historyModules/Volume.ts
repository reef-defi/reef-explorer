import BigNumber from "bignumber.js";
import { queryv2 } from "../../utils/connector";
import logger from "../../utils/logger";
import MarketHistoryModule from "./MarketHistoryModule";


type BlockPoolVolume = [BigNumber, BigNumber];
type BlockVolume = {
  [poolId: string]: BlockPoolVolume;
}

class Volume implements MarketHistoryModule {
  private static pools: string[] = [];
  private static blockVolume: BlockVolume = {};

  static async init(blockId: string): Promise<void> {
    logger.info("Initializing Volume holder on block: " + blockId);
    this.pools = await queryv2<{address: string}>('SELECT address FROM pool')
      .then((res) => res.map((r) => r.address));
    logger.info(`Volume for pools: [${this.pools.join(', ')}] initialized`);
  }

  static async save(blockId: string, timestamp: string): Promise<void> {
    await queryv2(
      `INSERT INTO volume_raw
        (block_id, pool_id, volume_1, volume_2, timestamp)
      VALUES
        %L;`,
      this.pools.map((poolId) => [
        blockId,
        poolId,
        this.blockVolume[poolId][0].toString(),
        this.blockVolume[poolId][1].toString(),
        timestamp,
      ])
    );
  }
}

export default Volume;