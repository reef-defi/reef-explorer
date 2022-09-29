import { BigNumber } from 'ethers';
import { nodeProvider } from '../utils/connector';
import { REEF_CONTRACT_ADDRESS, resolvePromisesAsChunks } from '../utils/utils';
import {
  isErc20TransferEvent, isErc721TransferEvent, isErc1155TransferSingleEvent, isErc1155TransferBatchEvent,
} from './evmEvent';
import {
  AccountHead, EventBody, EvmLogWithDecodedEvent, Transfer,
} from './types';
import { findNativeAddress } from './utils';

const evmLogToTransfer = async ({
  timestamp, address, blockId, extrinsicId, signedData,
}: EvmLogWithDecodedEvent, fromEvmAddress: string, toEvmAddress: string): Promise<Transfer> => {
  const [toAddress, fromAddress] = await Promise.all([
    findNativeAddress(toEvmAddress),
    findNativeAddress(fromEvmAddress),
  ]);

  return {
    blockId,
    timestamp,
    extrinsicId,
    eventId: 0,
    toEvmAddress,
    success: true,
    fromEvmAddress,
    errorMessage: '',
    tokenAddress: address,
    toAddress: toAddress === '' ? 'null' : toAddress,
    fromAddress: fromAddress === '' ? 'null' : fromAddress,
    feeAmount: BigNumber.from(signedData.fee.partialFee).toString(),
    amount: '0',
    type: 'ERC20',
  };
};

const erc20EvmLogToTransfer = async (log: EvmLogWithDecodedEvent): Promise<Transfer[]> => {
  const [from, to, amount] = log.decodedEvent.args;
  const base = await evmLogToTransfer(log, from, to);

  return [{
    ...base,
    type: 'ERC20',
    amount: amount.toString(),
    denom: log.contractData?.symbol,
  }];
};

const erc721EvmLogToTransfer = async (log: EvmLogWithDecodedEvent): Promise<Transfer[]> => {
  const [from, to, nftId] = log.decodedEvent.args;
  const base = await evmLogToTransfer(log, from, to);

  return [{
    ...base,
    type: 'ERC721',
    nftId: nftId.toString(),
  }];
};

const erc1155SingleEvmLogToTransfer = async (log: EvmLogWithDecodedEvent): Promise<Transfer[]> => {
  const [, from, to, nftId, amount] = log.decodedEvent.args;
  const base = await evmLogToTransfer(log, from, to);

  return [{
    ...base,
    type: 'ERC1155',
    nftId: nftId.toString(),
    amount: amount.toString(),
  }];
};

const erc1155BatchEvmLogToTransfer = async (log: EvmLogWithDecodedEvent): Promise<Transfer[]> => {
  const [, from, to, nftIds, amounts] = log.decodedEvent.args;
  const base = await evmLogToTransfer(log, from, to);

  return (nftIds as []).map((_, index) => ({
    ...base,
    type: 'ERC1155',
    nftId: nftIds[index].toString(),
    amount: amounts[index].toString(),
  }));
};

export const processTokenTransfers = async (evmLogs: EvmLogWithDecodedEvent[]): Promise<Transfer[]> => {
  const transfers = evmLogs
    .map(async (log): Promise<Transfer[]> => {
      if (isErc20TransferEvent(log)) {
        return erc20EvmLogToTransfer(log);
      } if (isErc721TransferEvent(log)) {
        return erc721EvmLogToTransfer(log);
      } if (isErc1155TransferSingleEvent(log)) {
        return erc1155SingleEvmLogToTransfer(log);
      } if (isErc1155TransferBatchEvent(log)) {
        return erc1155BatchEvmLogToTransfer(log);
      }
      return Promise.resolve([]);
    });
  const result = await resolvePromisesAsChunks(transfers);
  return result.flat();
};

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

export const isTransferEvent = ({ event: { event } }: EventBody) => nodeProvider.getProvider().api.events.balances.Transfer.is(event);

export const processTransferEvent = async ({
  event: { event: { data } }, status, signedData, extrinsicId, blockId, timestamp,
}: EventBody): Promise<Transfer> => {
  const [fromAddress, toAddress, amount] = data;
  const [toEvmAddress, fromEvmAddress] = await Promise.all([
    nodeProvider.query((provider) => provider.api.query.evmAccounts.evmAddresses(toAddress)),
    nodeProvider.query((provider) => provider.api.query.evmAccounts.evmAddresses(fromAddress)),
  ]);
  const feeAmount = BigNumber.from(signedData!.fee.partialFee).toString();
  return {
    amount: amount.toString(),
    eventId: 0,
    blockId,
    feeAmount,
    timestamp,
    extrinsicId,
    tokenAddress: REEF_CONTRACT_ADDRESS,
    toAddress: toAddress.toString(),
    fromAddress: fromAddress.toString(),
    toEvmAddress: toEvmAddress.toString(),
    fromEvmAddress: fromEvmAddress.toString(),
    denom: 'REEF',
    type: 'Native',
    success: status.type === 'success',
    errorMessage: status.type === 'error' ? status.message : '',
  };
};
