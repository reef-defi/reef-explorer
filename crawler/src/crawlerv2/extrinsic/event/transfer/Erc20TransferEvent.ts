import { TokenHolder } from '../../../../crawler/types';
import { balanceOf } from '../../../../crawler/utils';
import { insertAccountTokenHolders } from '../../../../queries/tokenHoldes';
import logger from '../../../../utils/logger';
import AccountManager from '../../../managers/AccountManager';
import { ExtrinsicData } from '../../../types';
import DefaultErcTransferEvent from './DefaultErcTransferEvent';

class Erc20TransferEvent extends DefaultErcTransferEvent {
  accountTokenHolders: TokenHolder[] = [];

  contractTokenHolders: TokenHolder[] = [];

  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);
    logger.info('Processing Erc20 transfer event');

    const [from, to, amount] = this.data!.parsed.args;
    const toEvmAddress = to.toString();
    const fromEvmAddress = from.toString();
    const tokenAddress = this.contract.address;
    const abi = this.contract.compiled_data[this.contract.name];

    // Resolving accounts
    const toAddress = await accountsManager.useEvm(toEvmAddress);
    const fromAddress = await accountsManager.useEvm(fromEvmAddress);

    logger.info(`Processing ERC20: ${this.contract.address} transfer from ${fromAddress} to ${toAddress} -> ${amount.toString()}`);
    this.transfers.push({
      type: 'ERC20',
      toEvmAddress,
      tokenAddress,
      fromEvmAddress,
      blockId: this.head.blockId,
      timestamp: this.head.timestamp,
      amount: amount.toString(),
      denom: this.contract.contract_data?.symbol,
      toAddress,
      fromAddress,
    });

    if (toAddress !== '0x') {
      const toBalance = await balanceOf(toEvmAddress, tokenAddress, abi);
      this.addTokenHolder(
        toAddress,
        toEvmAddress,
        toBalance,
      );
    }

    if (fromAddress !== '0x') {
      const fromBalance = await balanceOf(fromEvmAddress, tokenAddress, abi);
      this.addTokenHolder(
        fromAddress,
        fromEvmAddress,
        fromBalance,
      );
    }
  }

  async save(extrinsicData: ExtrinsicData): Promise<void> {
    await super.save(extrinsicData);

    // Saving account token holders and displaying updated holders and signers
    if (this.accountTokenHolders.length > 0) {
      logger.info(
        `Updating account token holders for (tokenAddress, signer): \n\t- ${this.accountTokenHolders
          .map(({ evmAddress, tokenAddress }) => `(${tokenAddress}, ${evmAddress})`)
          .join(',\n\t- ')}`,
      );
      await insertAccountTokenHolders(this.accountTokenHolders);
    }

    // Saving account token holders and displaying updated holders and signers
    if (this.contractTokenHolders.length > 0) {
      logger.info(
        `Updating contract token holders for (tokenAddress, contract): \n\t- ${this.contractTokenHolders
          .map(({ evmAddress, tokenAddress }) => `(${tokenAddress}, ${evmAddress})`)
          .join(',\n\t- ')}`,
      );
      await insertAccountTokenHolders(this.contractTokenHolders);
    }
  }
}

export default Erc20TransferEvent;
