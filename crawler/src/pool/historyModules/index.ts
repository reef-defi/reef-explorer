import logger from "../../utils/logger";
import MarketHistoryModule from "./MarketHistoryModule";
import Reserves from "./Reserves";
import TokenPrices from "./TokenPrices";

const modules = [
  Reserves,
  TokenPrices,
];

class MarketHistory extends MarketHistoryModule {
  static async init(blockId: string): Promise<void> {
    logger.info(`Initializing market history for block ${blockId}`);
    for (const module of modules) {
      await module.init(blockId);
    }
  }

  static async save(blockId: string, timestamp: string): Promise<void> {
    for (const module of modules) {
      await module.save(blockId, timestamp);
    }
  }
}

export default MarketHistory;