import { TokenHolder } from '../../../../crawler/types';
import { balanceOf } from '../../../../crawler/utils';
import { insertAccountTokenHolders, insertContractTokenHolders } from '../../../../queries/tokenHoldes';
import { awaitForContract } from '../../../../utils/contract';
import logger from '../../../../utils/logger';
import { dropDuplicatesMultiKey } from '../../../../utils/utils';
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

    await awaitForContract(tokenAddress);
  }

  async save(extrinsicData: ExtrinsicData): Promise<void> {
    await super.save(extrinsicData);

    const accounts = dropDuplicatesMultiKey(
      this.accountTokenHolders.filter(({ type }) => type === "Account"),
      ["tokenAddress", "signerAddress"]
    );
    const contracts = dropDuplicatesMultiKey(
      this.accountTokenHolders.filter(({ type }) => type === "Contract"),
      ["tokenAddress", "evmAddress"]
    );
    // Saving account token holders and displaying updated holders and signers
    if (accounts.length > 0) {
      logger.info(
        `Updating account token holders for (tokenAddress, signer): \n\t- ${accounts
          .map(({ signerAddress, tokenAddress }) => `(${tokenAddress}, ${signerAddress})`)
          .join(',\n\t- ')}`,
      );
      await insertAccountTokenHolders(accounts);
    }

    // Saving account token holders and displaying updated holders and signers
    if (contracts.length > 0) {
      logger.info(
        `Updating contract token holders for (tokenAddress, contract): \n\t- ${contracts
          .map(({ evmAddress, tokenAddress }) => `(${tokenAddress}, ${evmAddress})`)
          .join(',\n\t- ')}`,
      );
      await insertContractTokenHolders(contracts);
    }
  }
}

export default Erc20TransferEvent;
