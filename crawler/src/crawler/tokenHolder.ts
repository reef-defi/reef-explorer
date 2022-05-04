import {
  REEF_CONTRACT_ADDRESS, resolvePromisesAsChunks, REEF_DEFAULT_DATA, dropDuplicatesMultiKey, dropDuplicates, removeUndefinedItem,
} from '../utils/utils';
import {
  isErc20TransferEvent, isErc721TransferEvent, isErc1155TransferSingleEvent, isErc1155TransferBatchEvent,
} from './evmEvent';
import {
  TokenHolder, EvmLogWithDecodedEvent, TokenHolderHead, TokenType, AccountBody,
} from './types';
import { balanceOf, balanceOfErc1155, findNativeAddress } from './utils';

const prepareTokenHolderHead = (evmAddress: string, nftId: null | string, type: TokenType, {
  timestamp, address: tokenAddress, contractData, abis, name,
}: EvmLogWithDecodedEvent): TokenHolderHead => ({
  type,
  nftId,
  timestamp,
  evmAddress,
  tokenAddress,
  abi: abis[name],
  info: contractData,
});

const processTokenHolderHead = async (head: TokenHolderHead, balance: string): Promise<TokenHolder> => {
  const native = await findNativeAddress(head.evmAddress);
  return {
    ...head,
    balance,
    signerAddress: native,
    evmAddress: native !== '' ? '' : head.evmAddress,
    type: native !== '' ? 'Account' : 'Contract',
  };
};

const base = (from: string, to: string, nft: null | string, type: TokenType, log: EvmLogWithDecodedEvent): TokenHolderHead[] => [
  prepareTokenHolderHead(to, nft, type, log),
  prepareTokenHolderHead(from, nft, type, log),
];

const evmLogToTokenHolderHead = (log: EvmLogWithDecodedEvent): TokenHolderHead[] => {
  if (isErc20TransferEvent(log)) {
    const [from, to] = log.decodedEvent.args;
    return base(from, to, null, 'ERC20', log);
  }
  if (isErc721TransferEvent(log)) {
    const [from, to, nft] = log.decodedEvent.args;
    return base(from, to, nft.toString(), 'ERC721', log);
  }
  if (isErc1155TransferSingleEvent(log)) {
    const [, from, to, nft] = log.decodedEvent.args;
    return base(from, to, nft.toString(), 'ERC1155', log);
  }
  if (isErc1155TransferBatchEvent(log)) {
    const [, from, to, nfts] = log.decodedEvent.args;
    return (nfts as [])
      .flatMap((_, index) => base(from, to, nfts[index].toString(), 'ERC1155', log));
  }
  return [];
};

export const processEvmTokenHolders = async (evmLogs: EvmLogWithDecodedEvent[]): Promise<TokenHolder[]> => {
  const tokenHolders = dropDuplicatesMultiKey(
    evmLogs.flatMap(evmLogToTokenHolderHead),
    ['evmAddress', 'tokenAddress', 'nftId'],
  )
    .filter(({ evmAddress }) => evmAddress !== '0x0000000000000000000000000000000000000000')
    // Balance of function is surrounded by a try-catch statement because every contract can be deleted.
    // If a contract is deleted there is no on-chain data and the old data can not be reached.
    // Therefore we are capturing these events and filtering them out.
    .map(async (head) => {
      try {
        const balance = head.type === 'ERC1155'
          ? await balanceOfErc1155(head.evmAddress, head.tokenAddress, head.nftId!, head.abi)
          : await balanceOf(head.evmAddress, head.tokenAddress, head.abi);
        return processTokenHolderHead(head, balance);
      } catch (e) {
        return undefined;
      }
    });

  const results = await resolvePromisesAsChunks(tokenHolders);
  return results.filter(removeUndefinedItem);
};

export const processNativeTokenHolders = (accounts: AccountBody[]): TokenHolder[] => dropDuplicates(accounts, 'address')
  .map(({ address, timestamp, freeBalance }): TokenHolder => ({
    timestamp,
    signerAddress: address,
    tokenAddress: REEF_CONTRACT_ADDRESS,
    info: { ...REEF_DEFAULT_DATA },
    balance: freeBalance,
    type: 'Account',
    evmAddress: '',
    nftId: null,
  }));
