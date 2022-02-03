import { nodeProvider } from "../utils/connector";
import { REEF_CONTRACT_ADDRESS, resolvePromisesAsChunks, REEF_DEFAULT_DATA, dropDuplicatesMultiKey } from "../utils/utils";
import { isErc20TransferEvent, isErc721TransferEvent, isErc1155TransferSingleEvent, isErc1155TransferBatchEvent } from "./evmEvent";
import { Transfer, NativeTokenHolderHead, TokenHolder, EvmLogWithDecodedEvent, TokenHolderHead, ABI, TokenType } from "./types";
import { balanceOf, balanceOfErc1155, findNativeAddress } from "./utils";

const extractNativeTokenHolderFromTransfer = ({
  fromAddress, toAddress, timestamp,
}: Transfer): NativeTokenHolderHead[] => [
  {
    timestamp, signerAddress: fromAddress, info: {...REEF_DEFAULT_DATA}, tokenAddress: REEF_CONTRACT_ADDRESS,
  },
  {
    timestamp, signerAddress: toAddress, info: {...REEF_DEFAULT_DATA}, tokenAddress: REEF_CONTRACT_ADDRESS,
  },
];

const nativeTokenHolder = async (tokenHolderHead: NativeTokenHolderHead): Promise<TokenHolder> => {
  const signer = tokenHolderHead.signerAddress;
  const balance = await nodeProvider.query((provider) => provider.api.derive.balances.all(signer));

  return {
    ...tokenHolderHead,
    type: 'Account',
    evmAddress: '',
    nftId: null,
    balance: balance.freeBalance.toString(),
  };
};

const prepareTokenHolderHead = (evmAddress: string, nftId: null | string, type: TokenType, {timestamp, address: tokenAddress, contractData, abis, name}: EvmLogWithDecodedEvent): TokenHolderHead => ({
  type,
  nftId,
  timestamp,
  evmAddress,
  tokenAddress,
  abi: abis[name],
  info: contractData,
})

const processTokenHolderHead = async (head: TokenHolderHead, balance: string): Promise<TokenHolder> => {
  const native = await findNativeAddress(head.evmAddress);
  return {...head,
    balance,
    signerAddress: native,
    evmAddress: native !== '' ? '' : head.evmAddress,
    type: native !== '' ? 'Account' : 'Contract'
  };
}

const base = (from: string, to: string, nft: null | string, type: TokenType, log: EvmLogWithDecodedEvent): TokenHolderHead[] => [
  prepareTokenHolderHead(to, nft, type, log),
  prepareTokenHolderHead(from, nft, type, log),
]

const evmLogToTokenHolderHead = (log: EvmLogWithDecodedEvent): TokenHolderHead[] => {
  if (isErc20TransferEvent(log)) {
    const [from, to] = log.decodedEvent.args;
    return base(from, to, null, 'ERC20', log);
  }
  else if (isErc721TransferEvent(log)) {
    const [from, to, nft] = log.decodedEvent.args;
    return base(from, to, nft.toString(), 'ERC721', log);
  }
  else if (isErc1155TransferSingleEvent(log)) {
    const [,from, to, nft] = log.decodedEvent.args;
    return base(from, to, nft.toString(), 'ERC1155', log);
  }
  else if (isErc1155TransferBatchEvent(log)) {
    const [,from, to, nfts, ] = log.decodedEvent.args;
    return (nfts as [])
      .flatMap((_, index) => base(from, to, nfts[index].toString(), 'ERC1155', log));
  }
  return [];
}

export const processEvmTokenHolders = async (evmLogs: EvmLogWithDecodedEvent[]): Promise<TokenHolder[]> => {
  const tokenHolders = dropDuplicatesMultiKey(
    evmLogs.flatMap(evmLogToTokenHolderHead),
    ["evmAddress", "tokenAddress", "nftId"]
  )
  .filter(({evmAddress}) => evmAddress !== 'deleted' && evmAddress !== '0x0000000000000000000000000000000000000000')
  .map(async (head) => {
    const balance = head.type === 'ERC1155' 
      ? await balanceOfErc1155(head.evmAddress, head.tokenAddress, head.nftId!, head.abi)
      : await balanceOf(head.evmAddress, head.tokenAddress, head.abi);
    return processTokenHolderHead(head, balance);
  })

  return resolvePromisesAsChunks(tokenHolders);
}

export const processNativeTokenHolders = async (transfers: Transfer[]): Promise<TokenHolder[]> => {
  const tokenHolders = dropDuplicatesMultiKey(
    transfers.flatMap(extractNativeTokenHolderFromTransfer),
    ["signerAddress", 'tokenAddress']
  );

  return resolvePromisesAsChunks(
    tokenHolders
      .filter(({signerAddress}) => signerAddress !== 'deleted')
      .map(nativeTokenHolder)
  );
};