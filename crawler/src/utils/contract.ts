import { queryv2 } from "./connector"
import logger from "./logger";
import { wait } from "./utils";

export const awaitForContract = async (address: string): Promise<void> => new Promise(async (resolve) => {
  let contracts = await queryv2('SELECT address FROM contract WHERE address = $1', [address]);

  while(contracts.length === 0) {
    logger.info(`Waiting for contract ${address} to be created`);
    await wait(100);
    contracts = await queryv2('SELECT id FROM contract WHERE address = $1', [address]);
  };
});