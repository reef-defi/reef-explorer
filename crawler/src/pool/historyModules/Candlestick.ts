import BigNumber from "bignumber.js";
import { insertV2, queryv2 } from "../../utils/connector";
import logger from "../../utils/logger";
import MarketHistoryModule from "./MarketHistoryModule";

type CandlestickPoolBlock = [
  BigNumber, // open
  BigNumber, // high
  BigNumber, // low
  BigNumber, // close
]

// Pool id and token address are formated like -> `poolId:tokenAddres`
type CandlestickBlock = {
  [poolIdAndTokenAddress: string]: CandlestickPoolBlock;
};

interface CandlestickData {
  close: string;
  pool_id: string;
  token_address: string;
}

class Candlestick implements MarketHistoryModule {
  private static candlesticks: CandlestickBlock = {};

  static async init(blockId: string): Promise<void> {
    const initialData = await queryv2<CandlestickData>(
      `SELECT pool_id, token_address, close FROM candlestick WHERE block_id = $1;`,
      [blockId]
    );

    this.candlesticks = initialData.reduce((acc, d) => {
        const close = new BigNumber(d.close);
        acc[`${d.pool_id}:${d.token_address}`] = [close, close, close, close];
        return acc;
      },
      {} as CandlestickBlock
    );
  }

  static updateCandlestick(poolId: string, tokenAddress: string, price: BigNumber): void {
    const key = `${poolId}:${tokenAddress}`;
    if (!this.candlesticks[key]) {
      logger.info(
        `Candlestick initialized for pool: ${poolId} and token: ${tokenAddress} with \n\tOpen = ${price.toString()}\n\tHigh = ${price.toString()}\n\tLow = ${price.toString()}\n\tClose = ${price.toString()}`
      );
      this.candlesticks[key] = [price, price, price, price];
    } else {
      const [open, high, low] = this.candlesticks[key];
      this.candlesticks[key] = [
        open,
        high.gt(price) ? high : price,
        low.lt(price) ? low : price,
        price,
      ];
      logger.info(
        `Candlestick updated for pool: ${poolId} and token: ${tokenAddress} with \n\tOpen = ${this.candlesticks[
          key
        ][0].toString()}\n\tHigh = ${this.candlesticks[
          key
        ][1].toString()}\n\tLow = ${this.candlesticks[
          key
        ][2].toString()}\n\tClose = ${this.candlesticks[key][3].toString()}`
      );
    }
  }

  private static prepareCandlestickForNextBlock() {
    const keys = Object.keys(this.candlesticks);
    this.candlesticks = keys.reduce((acc, key) => {
        const [, , , close] = this.candlesticks[key];
        acc[key] = [close, close, close, close];
        return acc;
      },
      {} as CandlestickBlock
    );
  }

  static async save(blockId: string, timestamp: string): Promise<void> {
    const keys = Object.keys(this.candlesticks);
    await insertV2(
      `INSERT INTO candlestick
        (block_id, pool_id, token_address, open, high, low, close, timestamp)
      VALUES
        %L;`,
      keys.map((key) => {
        const [open, high, low, close] = this.candlesticks[key];
        const [poolId, tokenAddress] = key.split(':');
        return [blockId, poolId, tokenAddress, open.toString(), high.toString(), low.toString(), close.toString(), timestamp];
      }
    ));
    this.prepareCandlestickForNextBlock();
  }
};

export default Candlestick;