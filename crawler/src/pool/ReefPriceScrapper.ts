import axios, {AxiosResponse} from "axios";
import logger from "../utils/logger";
import { wait } from "../utils/utils";

const coingeckoApi = axios.create({baseURL: "https://api.coingecko.com/api/v3/"});

// Coingecko response types
type PriceHistory = {
  market_data: {
    current_price: {
      [currency: string]: number;
    };
  };
};

type CurrentPrice = {
  [currency: string]: {
    usd: number;
  };
};

const date2String = (date: Date): string => date
  .toISOString()
  .split("T")[0]
  .split("-")
  .reverse()
  .join("-");

// Retrieving current reef price from coingecko
const getReefCurrentPrice = async (): Promise<number> => coingeckoApi
  .get<void, AxiosResponse<CurrentPrice>>(
    `/simple/price?ids=reef&vs_currencies=usd`,
  )
  .then((res) => res.data.reef.usd)
  .catch((err) => {
    throw new Error('Error getting current price from coingecko: ' + err.message);
  });

// Retrieving reef price history from coingecko
const getReefPriceHistory = async (date: Date): Promise<number> => coingeckoApi
  .get<void, AxiosResponse<PriceHistory>>(
    `/coins/reef/history?date=${date2String(date)}`
  )
  .then((res) => res.data.market_data.current_price.usd)
  .catch((err) => {
    throw new Error('Error getting history price from coingecko: ' + err.message);
  });

type HistoryData = { [date: string]: number };

/**
 * Usage:
 * const price = await ReefPriceScrapper.getPrice(new Date());
 */
class ReefPriceScrapper {
  private static history: HistoryData = {};

  static async getPrice(date: Date): Promise<number> {
    // Check if date is less then one minute old, if so return latest price
    if (date > new Date(Date.now() - 1000 * 60)) {
      return await getReefCurrentPrice()
    }
   
    const stringDate = date2String(date);
   
    // Check if date is in history return price
    if (this.history[stringDate]) {
      return this.history[stringDate];
    };
  
    // Else get price from coingecko, add to history and return price
    logger.info(`Extracting reef price for date: ${stringDate}`);
    this.history[stringDate] = await getReefPriceHistory(date);
    logger.info(`Price: ${this.history[stringDate]}`);
    return this.history[stringDate];
  }
}

export default ReefPriceScrapper;