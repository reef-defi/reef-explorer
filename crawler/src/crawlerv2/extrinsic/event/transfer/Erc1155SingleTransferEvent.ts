import { utils } from 'ethers';
import { balanceOfErc1155 } from '../../../../crawler/utils';
import logger from '../../../../utils/logger';
import AccountManager from '../../../managers/AccountManager';
import DefaultErcTransferEvent from './DefaultErcTransferEvent';

class Erc1155SingleTransferEvent extends DefaultErcTransferEvent {
  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);
    logger.info('Processing Erc1155 single transfer event');
    const [, fromEvmAddress, toEvmAddress, nftId, amount] = this.data!.parsed.args;
    const abi = this.contract.compiled_data[this.contract.name];
    const tokenAddress = this.contract.address;
    const toAddress = await accountsManager.useEvm(toEvmAddress);
    const fromAddress = await accountsManager.useEvm(fromEvmAddress);

    logger.info(`Processing ERC1155: ${this.contract.address} single transfer from ${fromAddress} to ${toAddress} -> Id: ${nftId.toString()} Amount: ${amount.toString()}`);
    this.transfers.push({
      blockId: this.head.blockId,
      timestamp: this.head.timestamp,
      toAddress,
      fromAddress,
      fromEvmAddress,
      toEvmAddress,
      tokenAddress,
      denom: this.contract.contract_data?.symbol,
      type: 'ERC1155',
      nftId: nftId.toString(),
      amount: amount.toString(),
    });

    if (utils.isAddress(toAddress)) {
      const toBalance = await balanceOfErc1155(toEvmAddress, tokenAddress, nftId, abi);

      this.addTokenHolder(
        toAddress,
        toEvmAddress,
        toBalance,
        nftId.toString(),
      );
    }
    if (utils.isAddress(fromAddress)) {
      const fromBalance = await balanceOfErc1155(fromEvmAddress, tokenAddress, nftId, abi);

      this.addTokenHolder(
        fromAddress,
        fromEvmAddress,
        fromBalance,
        nftId.toString(),
      );
    }
  }
}

export default Erc1155SingleTransferEvent;
