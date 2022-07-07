import logger from "../../../../utils/logger";
import AccountManager from "../../../managers/AccountManager";
import DefaultErcTransferEvent from "./DefaultErcTransferEvent";

class Erc1155SingleTransferEvent extends DefaultErcTransferEvent {
  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);
    logger.info('Processing Erc1155 single transfer event');
    const [, from, to, nftId, amount] = this.data?.parsed.decodedEvent.args;
    const base = await this.evmLogToTransfer(from, to, accountsManager);

    this.transfers.push({
      ...base,
      type: 'ERC1155',
      nftId: nftId.toString(),
      amount: amount.toString(),
    });
  }

}

export default Erc1155SingleTransferEvent;