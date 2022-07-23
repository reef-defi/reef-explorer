import { Contract } from 'ethers';
import { nodeProvider } from '../../../../utils/connector';
import logger from '../../../../utils/logger';
import AccountManager from '../../../managers/AccountManager';
import DefaultErcTransferEvent from './DefaultErcTransferEvent';

class Erc1155BatchTransferEvent extends DefaultErcTransferEvent {
  private async balanceOfBatch(address: string, tokenAddress: string, ids: string[]): Promise<string[]> {
    const contract = new Contract(tokenAddress, this.contract.compiled_data[this.contract.name], nodeProvider.getProvider());
    const result = await contract.balanceOfBatch(Array(ids.length).fill(address), ids);
    return result.map((amount: any) => amount.toString());
  }

  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);

    logger.info('Processing Erc1155 batch transfer event');
    const [, fromEvmAddress, toEvmAddress, nftIds, amounts] = this.data!.parsed.args;
    const tokenAddress = this.contract.address;
    const toAddress = await accountsManager.useEvm(toEvmAddress);
    const fromAddress = await accountsManager.useEvm(fromEvmAddress);
    const toBalances = await this.balanceOfBatch(toEvmAddress, tokenAddress, nftIds);
    const fromBalances = await this.balanceOfBatch(fromEvmAddress, tokenAddress, nftIds);

    for (let index = 0; index < nftIds.length; index++) {
      // Adding transe
      this.transfers.push({
        blockId: this.head.blockId,
        fromAddress,
        fromEvmAddress,
        timestamp: this.head.timestamp,
        toAddress,
        toEvmAddress,
        tokenAddress,
        type: 'ERC1155',
        denom: this.contract.contract_data?.symbol,
        nftId: nftIds[index].toString(),
        amount: amounts[index].toString(),
      });

      this.addTokenHolder(
        toAddress,
        toEvmAddress,
        toBalances[index],
        nftIds[index].toString(),
      );
      this.addTokenHolder(
        fromAddress,
        fromEvmAddress,
        fromBalances[index],
        nftIds[index].toString(),
      );
    }
  }
}

export default Erc1155BatchTransferEvent;
