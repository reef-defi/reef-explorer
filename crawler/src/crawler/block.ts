import {
  nodeProvider,
} from '../utils/connector';
import { insertMultipleBlocks, updateBlockFinalized } from '../queries/block';
import {
  extrinsicBodyToTransfer,
  extrinsicStatus,
  isExtrinsicNativeTransfer,
  resolveSigner,
} from './extrinsic';
import {
  AccountHead,
  BlockBody,
  BlockHash,
  EventBody,
  EventHead,
  ExtrinsicBody,
  ExtrinsicHead,
  SignedExtrinsicData,
} from './types';
import {
  InsertExtrinsicBody,
  insertExtrinsics,
  insertTransfers,
  nextFreeIds,
} from '../queries/extrinsic';
import { insertAccounts, insertEvents } from '../queries/event';
import {
  accountHeadToBody, accountNewOrKilled, extrinsicToEventHeader, isEventStakingReward, isEventStakingSlash, isExtrinsicEvent,
} from './event';
import {
  range,
  dropDuplicates,
  resolvePromisesAsChunks,
} from '../utils/utils';
import {
  extractAccountFromEvmCall,
  extrinsicToContract,
  extrinsicToEVMCall,
  extrinsicToEvmClaimAccount,
  isExtrinsicEVMCall,
  isExtrinsicEvmClaimAccount,
  isExtrinsicEVMCreate,
  extrinsicToEvmLogs,
} from './evmEvent';
import {
  insertContracts, insertEvmEvents,
} from '../queries/evmEvent';
import logger from '../utils/logger';
import insertStaking from '../queries/staking';
import insertTokenHolders from '../queries/tokenHoldes';
import { extractTransferAccounts, processTokenTransfers } from './transfer';
import { processEvmTokenHolders, processNativeTokenHolders } from './tokenHolder';

const blockHash = async (id: number): Promise<BlockHash> => {
  const hash = await nodeProvider.query((provider) => provider.api.rpc.chain.getBlockHash(id));
  return { id, hash };
};

const blockBody = async ({ id, hash }: BlockHash): Promise<BlockBody> => {
  const [signedBlock, extendedHeader, events, timestamp] = await Promise.all([
    nodeProvider.query((provider) => provider.api.rpc.chain.getBlock(hash)),
    nodeProvider.query((provider) => provider.api.derive.chain.getHeader(hash)),
    nodeProvider.query((provider) => provider.api.query.system.events.at(hash)),
    nodeProvider.query((provider) => provider.api.query.timestamp.now.at(hash)),
  ]);
  return {
    id, hash, signedBlock, extendedHeader, events, timestamp: (new Date(timestamp.toJSON())).toUTCString(),
  };
};

// TODO move in queries/block.ts
const blockBodyToInsert = ({
  id,
  hash,
  extendedHeader,
  signedBlock,
  timestamp,
}: BlockBody) => ({
  id,
  timestamp,
  finalized: true,
  hash: hash.toString(),
  author: extendedHeader?.author?.toString() || '',
  parentHash: signedBlock.block.header.parentHash.toString(),
  stateRoot: signedBlock.block.header.stateRoot.toString(),
  extrinsicRoot: signedBlock.block.header.extrinsicsRoot.toString(),
});

const blockToExtrinsicsHeader = ({
  id,
  signedBlock,
  events,
  timestamp,
}: BlockBody): ExtrinsicHead[] => signedBlock.block.extrinsics.map((extrinsic, index) => ({
  index,
  extrinsic,
  timestamp,
  blockId: id,
  events: events.filter(isExtrinsicEvent(index)),
  status: extrinsicStatus(events),
}));

const getSignedExtrinsicData = async (
  extrinsicHash: string,
): Promise<SignedExtrinsicData> => {
  const [fee, feeDetails] = await Promise.all([
    nodeProvider.query((provider) => provider.api.rpc.payment.queryInfo(extrinsicHash)),
    nodeProvider.query((provider) => provider.api.rpc.payment.queryFeeDetails(extrinsicHash)),
  ]);

  return {
    fee: fee.toJSON(),
    feeDetails: feeDetails.toJSON(),
  };
};

const extrinsicBody = (nextFreeId: number) => async (
  extrinsicHead: ExtrinsicHead,
  index: number,
): Promise<ExtrinsicBody> => ({
  ...extrinsicHead,
  id: nextFreeId + index,
  index,
  signedData: extrinsicHead.extrinsic.isSigned
    ? await getSignedExtrinsicData(extrinsicHead.extrinsic.toHex())
    : undefined,
});

const extrinsicToInsert = (
  {
    id, extrinsic, signedData, blockId, events, timestamp, index,
  }: ExtrinsicBody,
): InsertExtrinsicBody => {
  const status = extrinsicStatus(events);
  const {
    hash, method, args, meta,
  } = extrinsic;
  return {
    id,
    index,
    blockId,
    signedData,
    timestamp,
    status: status.type,
    hash: hash.toString(),
    method: method.method,
    section: method.section,
    signed: resolveSigner(extrinsic),
    args: JSON.stringify(args),
    docs: meta.docs.toLocaleString(),
    errorMessage: status.type === 'error' ? status.message : '',
  };
};

const eventToBody = (nextFreeId: number) => (event: EventHead, index: number): EventBody => ({
  id: nextFreeId + index,
  ...event,
});

export const processInitialBlocks = async (fromId: number, toId: number): Promise<number> => {
  if (toId - fromId <= 0) { return 0; }

  logger.info(`New unfinalized heads detected from ${fromId} to ${toId}`);

  let transactions = 0;
  const blockIds = range(fromId, toId);
  nodeProvider.setDbBlockId(toId - 1);

  logger.info('Retrieving unfinished block hashes');
  transactions += blockIds.length * 2;
  const hashes = await resolvePromisesAsChunks(blockIds.map(blockHash));
  logger.info('Retrieving unfinished block bodies');
  const blocks = await resolvePromisesAsChunks(hashes.map(blockBody));

  // Insert blocks
  logger.info('Inserting unfinished blocks in DB');
  await insertMultipleBlocks(blocks.map(blockBodyToInsert));
  return transactions;
};

export default async (
  fromId: number,
  toId: number,
): Promise<number> => {
  let transactions = 0;
  const blockIds = range(fromId, toId);
  nodeProvider.setDbBlockId(toId - 1);

  logger.info('Retrieving block hashes');
  transactions += blockIds.length * 2;
  const hashes = await resolvePromisesAsChunks(blockIds.map(blockHash));
  logger.info('Retrieving block bodies');
  let blocks = await resolvePromisesAsChunks(
    hashes
      .map(blockBody),
  );

  // Insert blocks
  logger.info('Inserting initial blocks in DB');
  await insertMultipleBlocks(blocks.map(blockBodyToInsert));

  // Extrinsics
  logger.info('Extracting and compressing blocks extrinsics');
  let extrinsicHeaders = blocks.map(blockToExtrinsicsHeader).flat();

  logger.info('Retrieving next free extrinsic and event ids');
  const [eid, feid] = await nextFreeIds();
  logger.info(`Extrinsic next id: ${eid}, Event next id: ${feid}`);

  logger.info('Retrieving neccessery extrinsic data');
  transactions += extrinsicHeaders.length;
  const extrinsics = await resolvePromisesAsChunks(
    extrinsicHeaders.map(extrinsicBody(feid)),
  );

  // Free memory
  blocks = [];
  extrinsicHeaders = [];

  logger.info('Inserting extriniscs');
  await insertExtrinsics(extrinsics.map(extrinsicToInsert));

  // Events
  logger.info('Extracting and compressing extrinisc events');
  const events = extrinsics.map(extrinsicToEventHeader).flat().map(
    eventToBody(eid),
  );

  logger.info('Inserting events');
  await insertEvents(events);

  // Transfers
  logger.info('Extracting native transfers');
  let transfers = await resolvePromisesAsChunks(extrinsics
    .filter(isExtrinsicNativeTransfer)
    .map(extrinsicBodyToTransfer));

  // Native token holders
  logger.info('Extracting native token holders from transfers');
  const tokenHolders = await processNativeTokenHolders(transfers);

  // EVM Calls
  logger.info('Extracting evm calls');
  const extrinsicEvmCalls = extrinsics.filter(isExtrinsicEVMCall);
  let evmCalls = extrinsicEvmCalls.map(extrinsicToEVMCall);

  // EVM Logs
  logger.info('Retrieving EVM log if contract is ERC20 token');
  transactions += extrinsicEvmCalls.length;
  const evmLogs = await extrinsicToEvmLogs(extrinsicEvmCalls);

  // Token Transfers
  logger.info('Extracting token transfer');
  let tokenTransfers = await processTokenTransfers(evmLogs);
  transactions += tokenTransfers.length;
  transfers.push(...tokenTransfers);
  tokenTransfers = [];

  // Evm Token Holders
  logger.info('Extracting EVM token holders');
  let evmTokenHolders = await processEvmTokenHolders(evmLogs);
  transactions += evmTokenHolders.length;
  tokenHolders.push(...evmTokenHolders);
  evmTokenHolders = [];


  // Accounts
  logger.info('Compressing transfer, event accounts, evm claim account');
  const allAccounts: AccountHead[][] = [];
  allAccounts.push(...transfers.map(extractTransferAccounts));
  allAccounts.push(...events.map(accountNewOrKilled));
  allAccounts.push(...evmCalls.map(extractAccountFromEvmCall));
  allAccounts.push(
    ...extrinsics
      .filter(isExtrinsicEvmClaimAccount)
      .map(extrinsicToEvmClaimAccount),
  );

  evmCalls = [];

  logger.info('Extracting, compressing and dropping duplicate accounts');
  let insertOrDeleteAccount = dropDuplicates(
    allAccounts.flat(),
    'address',
  ).filter(({ address }) => address.length === 48);

  logger.info('Retrieving used account info');
  transactions += insertOrDeleteAccount.length;
  let accounts = await resolvePromisesAsChunks(
    insertOrDeleteAccount.map(accountHeadToBody),
  );

  logger.info('Inserting or updating accounts');
  await insertAccounts(accounts);
  // Free memory
  accounts = [];
  insertOrDeleteAccount = [];

  // Staking Slash
  logger.info('Inserting staking slashes');
  await insertStaking(events.filter(isEventStakingSlash), 'Slash');

  // Staking Reward
  logger.info('Inserting staking rewards');
  await insertStaking(events.filter(isEventStakingReward), 'Reward');

  // Transfers
  logger.info('Inserting transfers');
  await insertTransfers(transfers);

  transfers = [];

  // Contracts
  logger.info('Extracting new contracts');
  let contracts = extrinsics
    .filter(isExtrinsicEVMCreate)
    .map(extrinsicToContract);
  logger.info('Inserting contracts');
  await insertContracts(contracts);
  contracts = [];

  logger.info('Inserting evm events');
  await insertEvmEvents(events);

  // Token holders
  await insertTokenHolders(tokenHolders);

  logger.info('Finalizing blocks');
  await updateBlockFinalized(fromId, toId);
  logger.info('Complete!');
  return transactions;
};
