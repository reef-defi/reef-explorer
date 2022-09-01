import { utils } from "ethers";
import ReefswapFactory from "../../assets/ReefswapFactoryAbi";
import config from "../../config";
import { RawEventData } from "../../crawler/types";
import { queryv2 } from "../../utils/connector";
import logger from "../../utils/logger";
import PoolEventBase from "./PoolEventBase";

class FactoryEvent extends PoolEventBase<RawEventData> {
  poolAddress?: string;
  tokenAddress1?: string;
  tokenAddress2?: string;

  constructor(evmEventId: string) {
    super(evmEventId);
  }

  async process(rawData: RawEventData): Promise<void> {
    if (!FactoryEvent.isFactoryCreateEvent(rawData.address)) {
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
        ($1, $2, $3, $4);`,
      [
        this.evmEventId, 
        this.poolAddress, 
        this.tokenAddress1, 
        this.tokenAddress2,
      ]
    );
  }

  static isFactoryCreateEvent(address: string): boolean {
    return address.toLowerCase() === config.reefswapFactoryAddress.toLowerCase();
  }
}

export default FactoryEvent;