import format from 'pg-format';
import { TokenHolder, TokenType } from '../../../../crawler/types';
import { insertAccountNftHolders, insertContractNftHolders } from '../../../../queries/tokenHoldes';
import { queryv2 } from '../../../../utils/connector';
import logger from '../../../../utils/logger';
import { dropDuplicatesMultiKey } from '../../../../utils/utils';
import { ExtrinsicData } from '../../../types';
import DefaultErcTransferEvent from './DefaultErcTransferEvent';
import { toTokenHolder } from './utils';

class NftTokenHolderEvent extends DefaultErcTransferEvent {
  name: TokenType = 'ERC1155';

  private async insertAccountNftHolders(tokenHolders: TokenHolder[]) {
    const statement = format(`
      INSERT INTO token_holder
        (signer, evm_address, type, token_address, nft_id, balance, info, timestamp)
      VALUES
        %L
      ON CONFLICT (signer, token_address, nft_id) WHERE evm_address IS NULL AND nft_id IS NOT NULL DO UPDATE SET
        balance = EXCLUDED.balance,
        timestamp = EXCLUDED.timestamp,
        info = EXCLUDED.info;`,
      tokenHolders.map(toTokenHolder)
    );
    await queryv2(statement); 
  }

  private async insertContractNftHolders(tokenHolders: TokenHolder[]) {
    const statement = format(`
      INSERT INTO token_holder
        (signer, evm_address, type, token_address, nft_id, balance, info, timestamp)
      VALUES
        %L
      ON CONFLICT (evm_address, token_address, nft_id) WHERE signer IS NULL AND nft_id IS NOT NULL DO UPDATE SET
        balance = EXCLUDED.balance,
        timestamp = EXCLUDED.timestamp,
        info = EXCLUDED.info;`,
      tokenHolders.map(toTokenHolder)
    );
    await queryv2(statement); 
  }

  async save(extrinsicData: ExtrinsicData): Promise<void> {
    await super.save(extrinsicData);
    // Saving account nft holders and displaying updated holders and signers
    const accounts = dropDuplicatesMultiKey(this.accountTokenHolders, ['signerAddress', 'tokenAddress', 'nftId']);
    const contracts = dropDuplicatesMultiKey(this.contractTokenHolders, ['evmAddress', 'tokenAddress', 'nftId']);
    
    if (accounts.length > 0) {
      logger.info(
        `Updating account ${this.name} holders for (tokenAddress, signer): \n\t- ${accounts
          .map(({ signerAddress, tokenAddress }) => `(${tokenAddress}, ${signerAddress})`)
          .join(',\n\t- ')}`,
      );
      await this.insertAccountNftHolders(accounts);
    }

    // Saving account nft holders and displaying updated holders and signers
    if (contracts.length > 0) {
      logger.info(
        `Updating contract ${this.name} holders for (tokenAddress, contract): \n\t- ${contracts
          .map(({ evmAddress, tokenAddress }) => `(${tokenAddress}, ${evmAddress})`)
          .join(',\n\t- ')}`,
      );
      await this.insertContractNftHolders(contracts);
    }
  }
}

export default NftTokenHolderEvent;
