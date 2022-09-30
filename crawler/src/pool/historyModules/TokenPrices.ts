import BigNumber from "bignumber.js";
import { insertV2, queryv2 } from "../../utils/connector";
import logger from "../../utils/logger";
import { REEF_CONTRACT_ADDRESS } from "../../utils/utils";
import MarketHistoryModule from "./MarketHistoryModule";
import ReefPriceScrapper from "./ReefPriceScrapper";
import { queryReservedData } from "./utils";

interface InitPrice {
  token_address: string;
  price: number;
}

const queryPriceData = async (blockId: string): Promise<InitPrice[]> =>
  queryv2<InitPrice>(
    "SELECT token_address, price FROM token_price WHERE block_id = $1",
    [blockId]
  );

  const dot = (matrix: number[][], vector: number[]): number[] =>
  matrix.map((row) =>
    row.reduce((acc, current, index) => acc + current * vector[index], 0)
  );

const estimateTokenPriceBasedOnReefPrice = (
  reserves: number[][],
  reefPrice: number,
  reefIndex: number
): number[] => {
  // Create new vector with reef price
  const prices = new Array(reserves.length)
    .fill(0)
    .map((_, i) => (i === reefIndex ? reefPrice : 0));

  // Solve the system of equations
  const newPrices = dot(reserves, prices);  

  // Inject reef price into the price vector
  return newPrices.map((price, index) => (index === reefIndex ? reefPrice : price));
};


class TokenPrices implements MarketHistoryModule {
  private static skip = false;
  private static tokens: string[] = [];
  private static priceVector: number[] = [];
  private static reserveMatrix: number[][] = [];

  static async init(blockId: string): Promise<void> {
    // On init reset all variables
    this.tokens = [];
    this.priceVector = [];
    this.reserveMatrix = [];

    // Retrieve block data from tokenPrice table
    const priceData = await queryPriceData(blockId);

    // Add tokens to the list and price vector
    for (const {price, token_address} of priceData) {
      this.addToken(token_address, price);
    }

    // Retrieve reserved data from reservedRaw table
    const reserveData = await queryReservedData(blockId);

    // Update the reserve matrix
    for (const {token_1, token_2, reserved_1, reserved_2, decimal_1, decimal_2} of reserveData) {
      this.updateReserves(
        token_1,
        token_2,
        new BigNumber(reserved_1).div(new BigNumber(10).pow(decimal_1)),
        new BigNumber(reserved_2).div(new BigNumber(10).pow(decimal_2))
      );
    }

    // If for some reason reef token is not in the list, add it
    if (this.tokens.indexOf(REEF_CONTRACT_ADDRESS) === -1) {
      this.addToken(REEF_CONTRACT_ADDRESS);
    }
  }

  static addPool(token1: string, token2: string): void {
    this.addToken(token1);
    this.addToken(token2);
  }

  static updateReserves(token1: string, token2: string, reserve1: BigNumber, reserve2: BigNumber): void {
    // Find the index of the tokens in the list
    const i = this.tokens.indexOf(token1);
    const j = this.tokens.indexOf(token2);

    // Ensure that the tokens are in the list
    if (i === -1 || j === -1) {
      throw new Error("Token not found");
    }

    logger.info(`Updating reserves for ${token1} and ${token2}`);

    // Update the reserve matrix
    this.reserveMatrix[i][j] = reserve1.div(reserve2).toNumber();
    this.reserveMatrix[j][i] = reserve2.div(reserve1).toNumber();

    // Update the price vector only when reef token is present in pool
    // This is because we are approximating the price of the token based on the reef price
    // Once we onboard stable coins and estimate price through them, we can remove this condition
    if (token1 === REEF_CONTRACT_ADDRESS || token2 === REEF_CONTRACT_ADDRESS) {
      this.skip = false;
    }
  }
  
  static async save(blockId: string, timestamp: string): Promise<void> {
    await this.estimatePrice(timestamp);
    await this.insertPrices(blockId, timestamp);
  }
  
  // Private methods
  private static addToken(token: string, price=0): void {
    const index = this.tokens.indexOf(token);
    if (index === -1) {
      const oldLength = this.tokens.length;
      // Add token to the listi
      this.tokens.push(token);
      // Add token to the price vector
      this.priceVector.push(price);
      // Add token to the reserve matrix
      this.reserveMatrix.push(new Array(oldLength).fill(0));
      this.reserveMatrix.forEach((row) => row.push(0));
    }
  }

  private static async estimatePrice(timestamp: string): Promise<void> {
    const reefIndex = this.tokens.indexOf(REEF_CONTRACT_ADDRESS);
    const currentReefPrice = this.priceVector[reefIndex];

    // Retrieve latest reef price
    const reefPrice = await ReefPriceScrapper.getPrice(new Date(timestamp))

    // Inject reef price into the price vector
    this.priceVector[reefIndex] = reefPrice;

    if (!this.skip || currentReefPrice !== reefPrice) {
      logger.info("Estimating token prices");
      // Solve the system of equations to estimate the prices
      // Update the price vector
      this.priceVector = estimateTokenPriceBasedOnReefPrice(
        this.reserveMatrix,
        this.priceVector[reefIndex],
        reefIndex
      );
    }

    this.skip = true;
  }

  private static async insertPrices(blockId: string, timestamp: string): Promise<void> {
    // Insert the price vector into the database
    await insertV2(
      "INSERT INTO token_price (block_id, timestamp, token_address, price) VALUES %L ON CONFLICT (block_id, token_address) DO NOTHING;",
      this.priceVector.map((price, i) => [
        blockId,
        timestamp,
        this.tokens[i],
        price.toString(),
      ])
    );
  }
}

export default TokenPrices;