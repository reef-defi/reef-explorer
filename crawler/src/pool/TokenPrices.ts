import BigNumber from "bn.js";
import { insertV2, queryv2 } from "../utils/connector";
import { REEF_CONTRACT_ADDRESS } from "../utils/utils";
import { estimateTokenPriceBasedOnReefPrice } from "./pricingAlgorithm";
import ReefPriceScrapper from "./ReefPriceScrapper";

interface InitPrice {
  token_address: string;
  price: number;
}

const queryPriceData = async (blockId: string): Promise<InitPrice[]> =>
  queryv2<InitPrice>(
    "SELECT token_address, price FROM tokenPrice WHERE block_id = $1",
    [blockId]
  );

interface InitReserve {
  token_1: string;
  token_2: string;
  reserved_1: number;
  reserved_2: number;
}

const queryReservedData = async (blockId: string): Promise<InitReserve[]> =>
  queryv2<InitReserve>(`
    SELECT p.token_1, p.token_2, r.reserved_1, r.reserved_2 
    FROM reservedRaw as r
    JOIN pool as p ON r.pool_id = p.id
    WHERE r.block_id = $1`,
    [blockId]
  );


class TokenPrices {
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
    for (const {token_1, token_2, reserved_1, reserved_2} of reserveData) {
      this.updateReserves(
        token_1,
        token_2,
        reserved_1,
        reserved_2
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

  static updateReserves(token1: string, token2: string, reserve1: number, reserve2: number): void {
    // Find the index of the tokens in the list
    const i = this.tokens.indexOf(token1);
    const j = this.tokens.indexOf(token2);

    // Ensure that the tokens are in the list
    if (i === -1 || j === -1) {
      throw new Error("Token not found");
    }

    // Update the reserve matrix
    const r1 = new BigNumber(reserve1);
    const r2 = new BigNumber(reserve2);

    this.reserveMatrix[i][j] = r1.div(r2).toNumber();
    this.reserveMatrix[j][i] = r2.div(r1).toNumber();

    this.skip = false;
  }
  
  static async estimatePrice(timestamp: string): Promise<void> {
    const reefIndex = this.tokens.indexOf(REEF_CONTRACT_ADDRESS);
    const currentReefPrice = this.priceVector[reefIndex];

    // Retrieve latest reef price
    const reefPrice = await ReefPriceScrapper.getPrice(new Date(timestamp))

    // Inject reef price into the price vector
    this.priceVector[reefIndex] = reefPrice;

    if (!this.skip || currentReefPrice !== reefPrice) {
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

  static async insertPrices(blockId: string, timestamp: string): Promise<void> {
    // Insert the price vector into the database
    await insertV2(
      "INSERT INTO tokenPrice (block_id, timestamp, token_address, price) VALUES %L;",
      this.priceVector.map((price, i) => [
        blockId,
        timestamp,
        this.tokens[i],
        price.toString(),
      ])
    );
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
}

export default TokenPrices;