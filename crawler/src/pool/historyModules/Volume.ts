import BigNumber from 'bignumber.js';
import { insertV2, queryv2 } from '../../utils/connector';
import logger from '../../utils/logger';
import MarketHistoryModule from './MarketHistoryModule';

type BlockPoolVolume = [BigNumber, BigNumber];
type BlockVolume = {
  [poolId: string]: BlockPoolVolume;
}

class Volume implements MarketHistoryModule {
  private static pools: string[] = [];

  private static blockVolume: BlockVolume = {};

  static async init(blockId: string): Promise<void> {
    logger.info(`Initializing Volume holder on block: ${blockId}`);
    this.pools = await queryv2<{id: string}>('SELECT id FROM pool')
      .then((res) => res.map((r) => r.id));
    logger.info(`Volume for pools: [${this.pools.join(', ')}] initialized`);
  }

  static updateVolume(poolId: string, volume1: string, volume2: string): void {
    const index = this.pools.indexOf(poolId);
    if (index === -1) {
      logger.info(`Volume detected new pool: ${poolId}`);
      this.pools.push(poolId);
    }

    if (this.blockVolume[poolId] === undefined) {
      logger.info(`Volume initialized for pool: ${poolId} with \n\tVolume1 = ${volume1.toString()}\n\tVolume2 = ${volume2.toString()}`);
      this.blockVolume[poolId] = [new BigNumber(volume1), new BigNumber(volume2)];
    } else {
      this.blockVolume[poolId][0] = this.blockVolume[poolId][0].plus(volume1);
      this.blockVolume[poolId][1] = this.blockVolume[poolId][1].plus(volume2);
      logger.info(`Volume updated for pool: ${poolId} with \n\tVolume1 = ${this.blockVolume[poolId][0].toString()}\n\tVolume2 = ${this.blockVolume[poolId][1].toString()}`);
    }
  }

  static async save(blockId: string, timestamp: string): Promise<void> {
    await insertV2(
      `INSERT INTO volume_raw
        (block_id, pool_id, volume_1, volume_2, timestamp)
      VALUES
        %L;`,
      this.pools.map((poolId) => [
        blockId,
        poolId,
        this.blockVolume[poolId] ? this.blockVolume[poolId][0].toString() : '0',
        this.blockVolume[poolId] ? this.blockVolume[poolId][1].toString() : '0',
        timestamp,
      ]),
    );
    this.blockVolume = {};
  }
}

export default Volume;
