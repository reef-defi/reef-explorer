import { utils } from "ethers";
import logger from "../../utils/logger";
import PoolEvent from "./PoolEvent";
import PoolEventBase from "./PoolEventBase";

class EmptyEvent extends PoolEventBase<utils.LogDescription> {
  async process(event: utils.LogDescription): Promise<void> {
    logger.info(`Processing empty event ${event.name} detected!`);
  }
}

export default EmptyEvent;