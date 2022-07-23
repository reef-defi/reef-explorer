import { TokenType } from '../../../../crawler/types';
import { insertAccountNftHolders, insertContractNftHolders } from '../../../../queries/tokenHoldes';
import logger from '../../../../utils/logger';
import { ExtrinsicData } from '../../../types';
import DefaultErcTransferEvent from './DefaultErcTransferEvent';

class NftTokenHolderEvent extends DefaultErcTransferEvent {
  name: TokenType = 'ERC1155';

  async save(extrinsicData: ExtrinsicData): Promise<void> {
    await super.save(extrinsicData);
    // Saving account nft holders and displaying updated holders and signers
    if (this.accountTokenHolders.length > 0) {
      logger.info(
        `Updating account ${this.name} holders for (tokenAddress, signer): \n\t- ${this.accountTokenHolders
          .map(({ evmAddress, tokenAddress }) => `(${tokenAddress}, ${evmAddress})`)
          .join(',\n\t- ')}`,
      );
      await insertAccountNftHolders(this.accountTokenHolders);
    }

    // Saving account nft holders and displaying updated holders and signers
    if (this.contractTokenHolders.length > 0) {
      logger.info(
        `Updating contract ${this.name} holders for (tokenAddress, contract): \n\t- ${this.contractTokenHolders
          .map(({ evmAddress, tokenAddress }) => `(${tokenAddress}, ${evmAddress})`)
          .join(',\n\t- ')}`,
      );
      await insertContractNftHolders(this.contractTokenHolders);
    }
  }
}

export default NftTokenHolderEvent;
