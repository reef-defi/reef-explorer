import { utils } from 'ethers';
import { TokenType } from '../../../../crawler/types';
import { balanceOf } from '../../../../crawler/utils';
import { awaitForContract } from '../../../../utils/contract';
import logger from '../../../../utils/logger';
import AccountManager from '../../../managers/AccountManager';
import NftTokenHolderEvent from './NftTokenHolderEvent';
import { ZERO_ADDRESS } from './utils';

class Erc721TransferEvent extends NftTokenHolderEvent {
  name: TokenType = 'ERC721';

  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);
    if (!this.id) {
      throw new Error('Event id is not collected');
    }

    logger.info('Processing Erc721 transfer event');
    const tokenAddress = this.contract.address;
    const [from, to, nftID] = this.data!.parsed.args;
    const abi = this.contract.compiled_data[this.contract.name];
    const nftId = nftID.toString();
    const toEvmAddress = to.toString();
    const fromEvmAddress = from.toString();
    const toAddress = await accountsManager.useEvm(toEvmAddress);
    const fromAddress = await accountsManager.useEvm(fromEvmAddress);

    logger.info(`Processing ERC721: ${this.contract.address} transfer from ${fromAddress} to ${toAddress}`);
    this.transfers.push({
      amount: '1',
      eventId: this.id,
      blockId: this.head.blockId,
      toAddress,
      fromAddress,
      fromEvmAddress,
      timestamp: this.head.timestamp,
      toEvmAddress,
      tokenAddress,
      type: 'ERC721',
      denom: this.contract.contract_data?.symbol,
      nftId,
    });

    if (utils.isAddress(toEvmAddress) && toEvmAddress !== ZERO_ADDRESS) {
      const toBalance = await balanceOf(toEvmAddress, tokenAddress, abi);
      this.addTokenHolder(
        toAddress,
        toEvmAddress,
        toBalance,
        nftId,
      );
    }
    if (utils.isAddress(fromEvmAddress) && fromEvmAddress !== ZERO_ADDRESS) {
      const fromBalance = await balanceOf(fromEvmAddress, tokenAddress, abi);
      this.addTokenHolder(
        fromAddress,
        fromEvmAddress,
        fromBalance,
        nftId,
      );
    }
    await awaitForContract(tokenAddress);
  }
}

export default Erc721TransferEvent;
