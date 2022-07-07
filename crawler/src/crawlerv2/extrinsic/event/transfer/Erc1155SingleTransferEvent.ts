import AccountManager from "../../../managers/AccountManager";
import EvmLogEvent from "../EvmLogEvent";
import DefaultErcTransferEvent from "./DefaultErcTransferEvent";

class Erc1155SingleTransferEvent extends DefaultErcTransferEvent {
  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);  
    const [, from, to, nftId, amount] = this.data?.parsed.decodedEvent.args;
    const base = await this.evmLogToTransfer(from, to);
  

    this.transfers.push({
      ...base,
      type: 'ERC1155',
      nftId: nftId.toString(),
      amount: amount.toString(),
    });
  }

}

export default Erc1155SingleTransferEvent;