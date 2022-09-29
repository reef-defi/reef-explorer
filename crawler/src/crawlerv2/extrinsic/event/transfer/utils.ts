import { TokenHolder } from '../../../../crawler/types';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const CHAIN_ADDRESS = '0x';

export type TokenHolderType = [
  string | null,
  string | null,
  'Account' | 'Contract',
  string,
  string | null,
  string,
  string,
  string,
]

export const toTokenHolder = ({
  signerAddress,
  balance,
  tokenAddress,
  info,
  evmAddress,
  type,
  timestamp,
  nftId,
}: TokenHolder): TokenHolderType => [
  signerAddress === '' ? null : signerAddress,
  evmAddress === '' ? null : evmAddress,
  type,
  tokenAddress,
  nftId,
  balance,
  JSON.stringify(info !== null ? info : {}),
  timestamp,
];
