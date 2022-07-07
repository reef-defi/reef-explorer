import AccountManager from "../../../managers/AccountManager";
import EvmLogEvent from "../EvmLogEvent";
import DefaultErcTransferEvent from "./DefaultErcTransferEvent";

class Erc721TransferEvent extends DefaultErcTransferEvent {
  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);
    const [from, to, nftId] = this.data?.parsed.args;
    const base = await this.evmLogToTransfer(from, to);

    this.transfers.push({
      ...base,
      type: 'ERC721',
      nftId: nftId.toString(),
    });
  }
}

export default Erc721TransferEvent;