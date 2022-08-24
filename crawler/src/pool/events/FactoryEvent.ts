import { utils } from "ethers";
import { RawEventData } from "../../crawler/types";
import { queryv2 } from "../../utils/connector";
import logger from "../../utils/logger";
import ReefswapFactory from "../../assets/ReefswapFactoryAbi";

class FactoryEvent {
  evmEventId: string;

  poolAddress?: string;
  tokenAddress1?: string;
  tokenAddress2?: string;

  constructor(evmEventId: string) {
    this.evmEventId = evmEventId;
  }

  async process(rawData: RawEventData): Promise<void> {
    if (!FactoryEvent.isFactoryEvent(rawData)) {
      throw new Error("Not a PairCreated ReefswapFactory event");
    }

    const contractInterface = new utils.Interface(ReefswapFactory);
    const data = contractInterface.parseLog(rawData);
    logger.info(`Reefswap Factory PairCreate event detected on evm even id: ${this.evmEventId}`);

    const [tokenAddress1, tokenAddress2, poolAddress] = data.args as string[];

    this.poolAddress = poolAddress;
    this.tokenAddress1 = tokenAddress1;
    this.tokenAddress2 = tokenAddress2;
  }

  async save(): Promise<void> {
    if (!this.poolAddress || !this.tokenAddress1 || !this.tokenAddress2) {
      throw new Error("Not all required fields are set! Call process() first");
    }

    await queryv2(
      `INSERT INTO pool 
        (evm_event_id, address, token_1, token_2)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7);`,
      [
        this.evmEventId, 
        this.poolAddress, 
        this.tokenAddress1, 
        this.tokenAddress2, 
      ]
    );
  }

  static isFactoryEvent(rawData: RawEventData): boolean {
    const contractInterface = new utils.Interface(ReefswapFactory);
    const data = contractInterface.parseLog(rawData);
    return data.name === 'PairCreated';
  }
}

export default FactoryEvent;