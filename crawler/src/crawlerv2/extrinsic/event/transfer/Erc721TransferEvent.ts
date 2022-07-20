import { TokenType } from "../../../../crawler/types";
import { balanceOf } from "../../../../crawler/utils";
import logger from "../../../../utils/logger";
import AccountManager from "../../../managers/AccountManager";
import NftTokenHolderEvent from "./NftTokenHolderEvent";

class Erc721TransferEvent extends NftTokenHolderEvent {
  name: TokenType = 'ERC721';
  
  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);

    logger.info('Processing Erc721 transfer event');
    const tokenAddress = this.contract.address;
    const [from, to, nftId] = this.data?.parsed.decodedEvent.args;
    const abi = this.contract.compiled_data[this.contract.name];
    const toEvmAddress = to.toString();
    const fromEvmAddress = from.toString();
    const toAddress = await accountsManager.useEvm(toEvmAddress)
    const fromAddress = await accountsManager.useEvm(fromEvmAddress)

    const toBalance = await balanceOf(toEvmAddress, tokenAddress, abi);
    const fromBalance = await balanceOf(fromEvmAddress, tokenAddress, abi);

    this.transfers.push({
      amount: '1',
      blockId: this.head.blockId,
      fromAddress,
      toAddress,
      fromEvmAddress,
      timestamp: this.head.timestamp,
      toEvmAddress,
      tokenAddress,
      type: 'ERC721',
      denom: this.contract.contract_data?.symbol,
      nftId,
    });

    this.addTokenHolder(
      toAddress, 
      toEvmAddress, 
      toBalance,
      nftId
    );
    this.addTokenHolder(
      fromAddress,
      fromEvmAddress,
      fromBalance,
      nftId
    );
  }
}

export default Erc721TransferEvent;