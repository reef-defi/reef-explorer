import { BigNumber } from "ethers";
import { nodeProvider } from "../utils/connector";
import { AccountHead, EvmLogWithDecodedEvent, Transfer } from "./types";

const evmLogToTransfer = async ({timestamp, address, blockId, extrinsicId, signedData}: EvmLogWithDecodedEvent, fromEvmAddress: string, toEvmAddress: string): Promise<Transfer> => {
  const [fromAddressQ, toAddressQ] = await Promise.all([
    nodeProvider.query((provider) => provider.api.query.evmAccounts.accounts(fromEvmAddress)),
    nodeProvider.query((provider) => provider.api.query.evmAccounts.accounts(toEvmAddress)),
  ]);
  const toAddress = toAddressQ.toString();
  const fromAddress = fromAddressQ.toString();

  return {
    blockId,
    timestamp,
    extrinsicId,
    toEvmAddress,
    success: true,
    fromEvmAddress,
    errorMessage: '',
    tokenAddress: address,
    toAddress: toAddress === '' ? 'null' : toAddress,
    fromAddress: fromAddress === '' ? 'null' : fromAddress,
    feeAmount: BigNumber.from(signedData.fee.partialFee).toString(),
    amount: "0",
    type: "ERC20",
  };
}

export const erc20EvmLogToTransfer = async (log: EvmLogWithDecodedEvent): Promise<Transfer> => {
  const [from, to, amount] = log.decodedEvent.args;
  const base = await evmLogToTransfer(log, from, to);

  return {...base,
    type: 'ERC20',
    amount: amount.toString(),
    denom: log.contractData?.symbol,
  }
};

export const erc721EvmLogToTransfer = async (log: EvmLogWithDecodedEvent): Promise<Transfer> => {
  const [from, to, nftId] = log.decodedEvent.args;
  const base = await evmLogToTransfer(log, from, to);

  return {...base,
    type: 'ERC721',
    nftId: nftId.toString(),
  }
}

export const erc1155SingleEvmLogToTransfer = async (log: EvmLogWithDecodedEvent): Promise<Transfer> => {
  const [,from, to, nftId, amount] = log.decodedEvent.args;
  const base = await evmLogToTransfer(log, from, to);

  return {...base,
    type: 'ERC1155',
    nftId: nftId.toString(),
    amount: amount.toString(),
  }
}

export const erc1155BatchEvmLogToTransfer = async (log: EvmLogWithDecodedEvent): Promise<Transfer[]> => {
  const [,from, to, nftIds, amounts] = log.decodedEvent.args;
  const base = await evmLogToTransfer(log, from, to);

  return (nftIds as []).map((_, index) => ({...base,
    type: 'ERC1155',
    nftId: nftIds[index].toString(),
    amount: amounts[index].toString(),
  }));
}

// Assigning that the account is active is a temporary solution!
// The correct way would be to first query db if account exists
// If it does not and if transfer has failed then the account is not active.
// The query can be skipped if we would have complete
// list available in function (dynamic programming)
export const extractTransferAccounts = ({
  fromAddress,
  toAddress,
  blockId,
  timestamp,
}: Transfer): AccountHead[] => [
  {
    blockId, address: fromAddress, active: true, timestamp,
  },
  {
    blockId, address: toAddress, active: true, timestamp,
  },
];
