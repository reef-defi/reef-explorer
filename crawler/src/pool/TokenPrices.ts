import BigNumber from "bn.js";

class TokenPrices {
  private static tokens: string[] = [];
  private static priceVector: BigNumber[] = [];
  private static reserveMatrix: BigNumber[][] = [];

  static async init(blockId: string): Promise<void> {
    // Retrieve block data from tokenPrice table
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