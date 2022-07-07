import AccountManager from "../../../managers/AccountManager";
import DefaultErcTransferEvent from "./DefaultErcTransferEvent";


class Erc20TransferEvent extends DefaultErcTransferEvent {
  
  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);

    const [from, to, amount] = this.data?.parsed.decodedEvent.args;
    const base = await this.evmLogToTransfer(from, to);
    
    this.transfers.push({
      ...base,
      type: 'ERC20',
      amount: amount.toString(),
      denom: this.contract.contract_data?.symbol,
    })
  }
};

export default Erc20TransferEvent;