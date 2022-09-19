import { utils } from 'ethers';
import { TokenHolder } from '../../../../crawler/types';
import { balanceOf } from '../../../../crawler/utils';
import { queryv2 } from '../../../../utils/connector';
import logger from '../../../../utils/logger';
import { dropDuplicatesMultiKey, REEF_CONTRACT_ADDRESS } from '../../../../utils/utils';
import AccountManager from '../../../managers/AccountManager';
import { ExtrinsicData } from '../../../types';
import DefaultErcTransferEvent from './DefaultErcTransferEvent';
import { toTokenHolder, ZERO_ADDRESS } from './utils';

import format from 'pg-format';


class Erc20TransferEvent extends DefaultErcTransferEvent {

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

    if (tokenAddress === REEF_CONTRACT_ADDRESS) {
      return;
    }

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

    if (utils.isAddress(toEvmAddress) && toEvmAddress !== ZERO_ADDRESS) {
      const toBalance = await balanceOf(toEvmAddress, tokenAddress, abi);
      this.addTokenHolder(
        toAddress,
        toEvmAddress,
        toBalance,
      );
    }

    if (utils.isAddress(fromEvmAddress) && fromEvmAddress !== ZERO_ADDRESS) {
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

    const accounts = dropDuplicatesMultiKey(this.accountTokenHolders, ['tokenAddress', 'signerAddress']);
    const contracts = dropDuplicatesMultiKey(this.contractTokenHolders, ['tokenAddress', 'evmAddress']);
    
    // Saving account token holders and displaying updated holders and signers
    if (accounts.length > 0) {
      logger.info(
        `Updating account token holders for (tokenAddress, signer): \n\t- ${accounts
          .map(({ signerAddress, tokenAddress }) => `(${tokenAddress}, ${signerAddress})`)
          .join(',\n\t- ')}`,
      );
      await this.insertAccountTokenHolders(accounts);
    }

    // Saving account token holders and displaying updated holders and signers
    if (contracts.length > 0) {
      logger.info(
        `Updating contract token holders for (tokenAddress, contract): \n\t- ${contracts
          .map(({ evmAddress, tokenAddress }) => `(${tokenAddress}, ${evmAddress})`)
          .join(',\n\t- ')}`,
      );
      await this.insertContractTokenHolders(contracts);
    }
  }

  private async insertAccountTokenHolders(tokenHolders: TokenHolder[]): Promise<void> {
    const statement = format(`
    INSERT INTO token_holder
      (signer, evm_address, type, token_address, nft_id, balance, info, timestamp)
    VALUES
      %L
    ON CONFLICT (signer, token_address) WHERE evm_address IS NULL AND nft_id IS NULL DO UPDATE SET
      balance = EXCLUDED.balance,
      timestamp = EXCLUDED.timestamp,
      info = EXCLUDED.info;`,
      tokenHolders.map(toTokenHolder)
    );
    await queryv2(statement); 
  }

  private async insertContractTokenHolders(tokenHolders: TokenHolder[]): Promise<void> {
    const statement = format(`
      INSERT INTO token_holder
        (signer, evm_address, type, token_address, nft_id, balance, info, timestamp)
      VALUES
        %L
      ON CONFLICT (evm_address, token_address) WHERE signer IS NULL AND nft_id IS NULL DO UPDATE SET
        balance = EXCLUDED.balance,
        timestamp = EXCLUDED.timestamp,
        info = EXCLUDED.info;`,
      tokenHolders.map(toTokenHolder)
    );
    await queryv2(statement);
  }
}

export default Erc20TransferEvent;
