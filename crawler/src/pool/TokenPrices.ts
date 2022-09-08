import BigNumber from "bn.js";
import { queryv2 } from "../utils/connector";

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
  private static tokens: string[] = [];
  private static priceVector: BigNumber[] = [];
  private static reserveMatrix: BigNumber[][] = [];

  static async init(blockId: string): Promise<void> {
    // On init reset all variables
    this.tokens = [];
    this.priceVector = [];
    this.reserveMatrix = [];

    // Retrieve block data from tokenPrice table
    const priceData = await queryPriceData(blockId);

    // Add tokens to the list and price vector
    for (const {price, token_address} of priceData) {
      this.tokens.push(token_address);
      this.priceVector.push(new BigNumber(price));
    }

    // Initialize the reserve matrix
    this.reserveMatrix = new Array(this.tokens.length).fill(
      new Array(this.tokens.length).fill(new BigNumber(0))
    );

    // Retrieve reserved data from reservedRaw table
    const reserveData = await queryReservedData(blockId);

    // Update the reserve matrix
    for (const {token_1, token_2, reserved_1, reserved_2} of reserveData) {
      const i = this.tokens.indexOf(token_1);
      const j = this.tokens.indexOf(token_2);
      this.reserveMatrix[i][j] = new BigNumber(reserved_1);
      this.reserveMatrix[j][i] = new BigNumber(reserved_2);
    }
  }

  static addPool(token1: string, token2: string): void {
    // Find if any of tokens are already in the list
    // If not add them to the list
    // Increase the size of the reserve matrix
    // Add prices to the price vector
  }
  static updateReserves(token1: string, token2: string, reserve1: BigNumber, reserve2: BigNumber): void {
    // Find the index of the tokens in the list
    // Update the reserve matrix
  }
  static async estimatePrice() {
    // Retrieve latest reef price
    // Inject reef price into the price vector
    // Solve the system of equations
    // Update the price vector
  }
  static async insertPrices(blockId: string, timestamp: string): Promise<void> {
    // Insert the price vector into the database
  }
}

export default TokenPrices;