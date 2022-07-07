import { Transfer } from "../../../../crawler/types";
import AccountManager from "../../../managers/AccountManager";
import DefaultErcTransferEvent from "./DefaultErcTransferEvent";

class Erc1155BatchTransferEvent extends DefaultErcTransferEvent {
  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);
    const [, from, to, nftIds, amounts] = this.data?.parsed.decodedEvent.args;
    const base = await this.evmLogToTransfer(from, to);

    const transfers: Transfer[] = (nftIds as []).map((_, index) => ({
      ...base,
      type: 'ERC1155',
      nftId: nftIds[index].toString(),
      amount: amounts[index].toString(),
    }))
    this.transfers.push(...transfers);
  }

}

export default Erc1155BatchTransferEvent;