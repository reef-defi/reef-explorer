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
    const accounts = dropDuplicatesMultiKey(
      this.accountTokenHolders.filter(({ type }) => type === "Account"),
      ["signerAddress", "tokenAddress", "nftId"]
    );
    const contracts = dropDuplicatesMultiKey(
      this.contractTokenHolders.filter(({ type }) => type === "Contract"),
      ["evmAddress", "tokenAddress", "nftId"]
    );
    if (accounts.length > 0) {
      logger.info(
        `Updating account ${this.name} holders for (tokenAddress, signer, nft): \n\t- ${accounts
          .map(({ signerAddress, tokenAddress, nftId }) => `(${tokenAddress}, ${signerAddress}, ${nftId})`)
          .join(',\n\t- ')}`,
      );
      await insertAccountNftHolders(accounts);
    }

    // Saving account nft holders and displaying updated holders and signers
    if (contracts.length > 0) {
      logger.info(
        `Updating contract ${this.name} holders for (tokenAddress, contract, nft): \n\t- ${contracts
          .map(({ evmAddress, tokenAddress, nftId }) => `(${tokenAddress}, ${evmAddress}, ${nftId})`)
          .join(',\n\t- ')}`,
      );
      await insertContractNftHolders(contracts);
    }
  }
}

export default NftTokenHolderEvent;
