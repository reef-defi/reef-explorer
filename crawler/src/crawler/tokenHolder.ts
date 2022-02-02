import { nodeProvider } from "../utils/connector";
import { REEF_CONTRACT_ADDRESS, dropDuplicates, resolvePromisesAsChunks } from "../utils/utils";
import { Transfer, NativeTokenHolderHead, TokenHolder } from "./types";

const extractNativeTokenHolderFromTransfer = ({
  fromAddress, toAddress, blockId, timestamp,
}: Transfer): NativeTokenHolderHead[] => [
  {
    timestamp, blockId, signerAddress: fromAddress, decimals: 18, contractAddress: REEF_CONTRACT_ADDRESS,
  },
  {
    timestamp, blockId, signerAddress: toAddress, decimals: 18, contractAddress: REEF_CONTRACT_ADDRESS,
  },
];

const nativeTokenHolder = async (tokenHolderHead: NativeTokenHolderHead): Promise<TokenHolder> => {
  const signer = tokenHolderHead.signerAddress;
  const balance = await nodeProvider.query((provider) => provider.api.derive.balances.all(signer));

  return {
    ...tokenHolderHead,
    signer,
    type: 'Account',
    evmAddress: '',
    balance: balance.freeBalance.toString(),
  };
};

export const extractNativeTokenHoldersFromTransfers = async (transfers: Transfer[]): Promise<TokenHolder[]> => {
  const nativeTokenHoldersHead = dropDuplicates(
    transfers
      .map(extractNativeTokenHolderFromTransfer)
      .flat(),
    'signerAddress',
  ).filter(({ signerAddress }) => signerAddress !== 'deleted');

  return resolvePromisesAsChunks(
    nativeTokenHoldersHead
      .map(nativeTokenHolder),
  );
};