import { TokenType } from '../../../../crawler/types';
import { insertAccountNftHolders, insertContractNftHolders } from '../../../../queries/tokenHoldes';
import logger from '../../../../utils/logger';
import { dropDuplicatesMultiKey } from '../../../../utils/utils';
import { ExtrinsicData } from '../../../types';
import DefaultErcTransferEvent from './DefaultErcTransferEvent';

class NftTokenHolderEvent extends DefaultErcTransferEvent {
  name: TokenType = 'ERC1155';

  async save(extrinsicData: ExtrinsicData): Promise<void> {
    await super.save(extrinsicData);
    // Saving account nft holders and displaying updated holders and signers
    const accounts = dropDuplicatesMultiKey(this.accountTokenHolders, ["signerAddress", "tokenAddress", "nftId"]);
    const contracts = dropDuplicatesMultiKey(this.contractTokenHolders, ["evmAddress", "tokenAddress", "nftId"]);
    if (accounts.length > 0) {
      logger.info(
        `Updating account ${this.name} holders for (tokenAddress, signer): \n\t- ${accounts
          .map(({ signerAddress, tokenAddress }) => `(${tokenAddress}, ${signerAddress})`)
          .join(',\n\t- ')}`,
      );
      await insertAccountNftHolders(accounts);
    }

    // Saving account nft holders and displaying updated holders and signers
    if (contracts.length > 0) {
      logger.info(
        `Updating contract ${this.name} holders for (tokenAddress, contract): \n\t- ${contracts
          .map(({ evmAddress, tokenAddress }) => `(${tokenAddress}, ${evmAddress})`)
          .join(',\n\t- ')}`,
      );
      await insertContractNftHolders(contracts);
    }
  }
}

export default NftTokenHolderEvent;
