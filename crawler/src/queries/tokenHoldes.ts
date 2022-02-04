import { TokenHolder } from '../crawler/types';
import { insertV2 } from '../utils/connector';
import logger from '../utils/logger';

const TOKEN_HOLDER_INSERT_STATEMENT = `
INSERT INTO token_holder
  (signer, evm_address, type, token_address, nft_id, balance, info, timestamp)
VALUES
  %L`;

const DO_UPDATE = ` balance = EXCLUDED.balance,
  timestamp = EXCLUDED.timestamp,
  info = EXCLUDED.info;`;

const toTokenHolder = ({
  signerAddress,
  balance,
  tokenAddress,
  info,
  evmAddress,
  type,
  timestamp,
  nftId,
}: TokenHolder): any[] => [signerAddress === '' ? null : signerAddress, evmAddress === '' ? null : evmAddress, type, tokenAddress.toLocaleLowerCase(), nftId, balance, JSON.stringify(info !== null ? info : {}), timestamp];

const insertAccountTokenHolders = async (tokenHolders: TokenHolder[]): Promise<void> => insertV2(
  `${TOKEN_HOLDER_INSERT_STATEMENT}
    ON CONFLICT (signer, token_address) WHERE evm_address IS NULL AND nft_id IS NULL DO UPDATE SET
    ${DO_UPDATE}
  `,
  tokenHolders.map(toTokenHolder),
);

const insertContractTokenHolders = async (tokenHolders: TokenHolder[]): Promise<void> => insertV2(
  `${TOKEN_HOLDER_INSERT_STATEMENT}
    ON CONFLICT (evm_address, token_address) WHERE signer IS NULL AND nft_id IS NULL DO UPDATE SET
    ${DO_UPDATE}
  `,
  tokenHolders.map(toTokenHolder),
);

const insertAccountNftHolders = async (tokenHolders: TokenHolder[]): Promise<void> => insertV2(
  `${TOKEN_HOLDER_INSERT_STATEMENT}
    ON CONFLICT (signer, token_address, nft_id) WHERE evm_address IS NULL AND nft_id IS NOT NULL DO UPDATE SET
    ${DO_UPDATE}
  `,
  tokenHolders.map(toTokenHolder),
);

const insertContractNftHolders = async (tokenHolders: TokenHolder[]): Promise<void> => insertV2(
  `${TOKEN_HOLDER_INSERT_STATEMENT}
    ON CONFLICT (evm_address, token_address, nft_id) WHERE signer IS NULL AND nft_id IS NOT NULL DO UPDATE SET
    ${DO_UPDATE}
  `,
  tokenHolders.map(toTokenHolder),
);

export default async (tokenHolders: TokenHolder[]): Promise<void> => {
  logger.info('Inserting account nft holders');
  await insertAccountNftHolders(
    tokenHolders.filter(({ type, nftId }) => type === 'Account' && nftId !== null),
  );
  logger.info('Inserting contract nft holders');
  await insertContractNftHolders(
    tokenHolders.filter(({ type, nftId }) => type === 'Contract' && nftId !== null),
  );
  logger.info('Inserting account token holders');
  await insertAccountTokenHolders(
    tokenHolders.filter(({ type, nftId }) => type === 'Account' && nftId === null),
  );
  logger.info('Inserting contract token holders');
  await insertContractTokenHolders(
    tokenHolders.filter(({ type, nftId }) => type === 'Contract' && nftId === null),
  );
};
