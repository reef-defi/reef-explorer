import { ABIS, ERC20Data, ERC721Data, TokenHolder } from "../crawler/types";
import { balanceOf, balanceOfErc1155 } from "../crawler/utils";
import { insertAccountNftHolders, insertAccountTokenHolders } from "../queries/tokenHoldes";
import { nodeProvider, queryv2 } from "../utils/connector";
import logger from "../utils/logger";
import { dropDuplicatesMultiKey } from "../utils/utils";

interface TokenHolderExtendedData {
  token_address: string;
  signer: string;
  evm_address: string;
  nft_id: string | null;
  info: ERC20Data | ERC721Data | null; // ERC1155 is an empty object
  type: 'Account';
  contract_type: 'ERC20' | 'ERC721' | 'ERC1155';
  name: string;
  compiled_data: ABIS;
}

const main = async () => {
  await nodeProvider.initializeProviders();

  logger.info('Retrieving wrong token holders');
  const data = await queryv2<TokenHolderExtendedData>(
    `SELECT 
      th.token_address, th.signer, th.evm_address, th.nft_id, th.type, th.info,
      vc.type as contract_type, vc.name, vc.compiled_data 
    FROM token_holder as th
    JOIN contract as c ON c.address = th.token_address
    JOIN verified_contract as vc ON c.address = vc.address
    WHERE th.signer IS NOT NULL AND th.evm_address IS NOT NULL;
  `);
  
  logger.info('Removing duplicates');
  // Aligning primary keys
  const result = dropDuplicatesMultiKey(data, ["token_address", "evm_address", "nft_id"]);

  // Creating new token holders
  const nftHolders: TokenHolder[] = [];
  const tokenHolders: TokenHolder[] = [];

  // Resolving latest balance of signer, token and nft
  for (let holder of result) {
    logger.info(`Processing signer ${holder.signer}, token: ${holder.token_address}, nft: ${holder.nft_id}`)
    const balance = holder.contract_type === 'ERC1155'
      ? await balanceOfErc1155(holder.evm_address, holder.token_address, holder.nft_id!, holder.compiled_data[holder.name])
      : await balanceOf(holder.evm_address, holder.token_address, holder.compiled_data[holder.name]);

    const newHolder: TokenHolder = {
      balance,
      evmAddress: '',
      info: holder.info,
      nftId: null,
      signerAddress: holder.signer,
      timestamp: new Date(Date.now()).toUTCString(),
      tokenAddress: holder.token_address,
      type: holder.type
    }; 

    if (holder.nft_id === null) {
      tokenHolders.push(newHolder);
    } else {
      nftHolders.push(newHolder);
    }
  }

  logger.info('Inserting account token holders');
  await insertAccountTokenHolders(tokenHolders)

  logger.info('Insert account nft holders');
  await insertAccountNftHolders(nftHolders);

  logger.info('Account token & nft holders repaired')
};

main()
  .then(() => process.exit())
  .then((e) => {
    logger.error(e);
    process.exit(404) 
  })