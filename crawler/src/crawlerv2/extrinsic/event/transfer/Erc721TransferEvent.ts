import logger from "../../../../utils/logger";
import AccountManager from "../../../managers/AccountManager";
import DefaultErcTransferEvent from "./DefaultErcTransferEvent";

class Erc721TransferEvent extends DefaultErcTransferEvent {
  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);

    logger.info('Processing Erc721 transfer event');
    const [from, to, nftId] = this.data?.parsed.args;
    const base = await this.evmLogToTransfer(from, to, accountsManager);

    this.transfers.push({
      ...base,
      type: 'ERC721',
      nftId: nftId.toString(),
    });
  }
}

export default Erc721TransferEvent;