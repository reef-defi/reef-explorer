import { Contract, utils } from 'ethers';
import { nodeProvider } from '../../../../utils/connector';
import logger from '../../../../utils/logger';
import AccountManager from '../../../managers/AccountManager';
import NftTokenHolderEvent from './NftTokenHolderEvent';
import { ZERO_ADDRESS } from './utils';

class Erc1155BatchTransferEvent extends NftTokenHolderEvent {
  private async balanceOfBatch(address: string, tokenAddress: string, ids: string[]): Promise<string[]> {
    const contract = new Contract(tokenAddress, this.contract.compiled_data[this.contract.name], nodeProvider.getProvider());
    const result = await contract.balanceOfBatch(Array(ids.length).fill(address), ids);
    return result.map((amount: any) => amount.toString());
  }

  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);
    if (!this.id) {
      throw new Error('Event id is not collected');
    }

    logger.info('Processing Erc1155 batch transfer event');
    const [, fromEvmAddress, toEvmAddress, nftIds, amounts] = this.data!.parsed.args;
    const tokenAddress = this.contract.address;
    const toAddress = await accountsManager.useEvm(toEvmAddress);
    const fromAddress = await accountsManager.useEvm(fromEvmAddress);

    const toIsValidAddress = utils.isAddress(toEvmAddress) && toEvmAddress !== ZERO_ADDRESS;
    const fromIsValidAddress = utils.isAddress(fromEvmAddress) && fromEvmAddress !== ZERO_ADDRESS;
    
    let toBalances: string[] = [];
    let fromBalances: string[] = [];

    if (toIsValidAddress) {
      toBalances = await this.balanceOfBatch(toEvmAddress, tokenAddress, nftIds);
    }

    if (fromIsValidAddress) {
      fromBalances = await this.balanceOfBatch(fromEvmAddress, tokenAddress, nftIds);
    }

    logger.info(`Processing ERC1155: ${this.contract.address} batch transfer from ${fromAddress} to ${toAddress} -> \n\tIds: ${nftIds}\n]\tAmounts: ${amounts}`);
    for (let index = 0; index < nftIds.length; index++) {
      // Adding transe
      this.transfers.push({
        eventId: this.id,
        blockId: this.head.blockId,
        fromEvmAddress,
        timestamp: this.head.timestamp,
        toEvmAddress,
        tokenAddress,
        type: 'ERC1155',
        denom: this.contract.contract_data?.symbol,
        nftId: nftIds[index].toString(),
        amount: amounts[index].toString(),
        toAddress,
        fromAddress,
      });

      if (toIsValidAddress) {
        this.addTokenHolder(
          toAddress,
          toEvmAddress,
          toBalances[index],
          nftIds[index].toString(),
        );
      }

      if (fromIsValidAddress) {
        this.addTokenHolder(
          fromAddress,
          fromEvmAddress,
          fromBalances[index],
          nftIds[index].toString(),
        );
      }
    }
  }
}

export default Erc1155BatchTransferEvent;
