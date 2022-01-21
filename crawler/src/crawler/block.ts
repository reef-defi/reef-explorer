import {
  getProvider,
  nodeQuery,
  setResolvingBlocksTillId,
} from '../utils/connector';
import { insertMultipleBlocks, updateBlockFinalized } from '../queries/block';
import {
  extrinsicBodyToTransfer,
  extrinsicStatus,
  isExtrinsicTransfer,
  resolveSigner,
} from './extrinsic';
import {
  AccountHead,
  BlockBody,
  BlockHash,
  Event,
  EventBody,
  EventHead,
  ExtrinsicBody,
  ExtrinsicHead,
  SignedExtrinsicData,
  Transfer,
} from './types';
import {
  InsertExtrinsicBody,
  insertExtrinsics,
  insertTransfers,
  nextFreeIds,
} from '../queries/extrinsic';
import { insertAccounts, insertEvents } from '../queries/event';
import { accountHeadToBody, accountNewOrKilled } from './event';
import {
  dropDuplicates,
  range,
  resolvePromisesAsChunks,
} from '../utils/utils';
import {
  extractEvmLogHeaders,
  extractTokenBalance,
  extractTokenTransferEvents,
  extrinsicToContract,
  extrinsicToEVMCall,
  extrinsicToEvmClaimAccount,
  isExtrinsicEVMCall,
  isExtrinsicEvmClaimAccount,
  isExtrinsicEVMCreate,
  tokenHolderToAccount,
} from './evmEvent';
import {
  insertAccountTokenBalances,
  insertContracts,
  insertEvmCalls,
} from '../queries/evmEvent';
import logger from '../utils/logger';
import insertStaking from '../queries/staking';

const blockHash = async (id: number): Promise<BlockHash> => {
  const hash = await nodeQuery((provider) => provider.api.rpc.chain.getBlockHash(id));
  return { id, hash };
};

const blockBody = async ({ id, hash }: BlockHash): Promise<BlockBody> => {
  const [signedBlock, extendedHeader, events, timestamp] = await Promise.all([
    nodeQuery((provider) => provider.api.rpc.chain.getBlock(hash)),
    nodeQuery((provider) => provider.api.derive.chain.getHeader(hash)),
    nodeQuery((provider) => provider.api.query.system.events.at(hash)),
    nodeQuery((provider) => provider.api.query.timestamp.now.at(hash)),
  ]);
  return {
    id, hash, signedBlock, extendedHeader, events, timestamp: (new Date(timestamp.toJSON())).toUTCString(),
  };
};

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

const isExtrinsicEvent = (extrinsicIndex: number) => ({ phase }: Event): boolean => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(extrinsicIndex);

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
    nodeQuery((provider) => provider.api.rpc.payment.queryInfo(extrinsicHash)),
    nodeQuery((provider) => provider.api.rpc.payment.queryFeeDetails(extrinsicHash)),
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

const extrinsicToEventHeader = ({
  id,
  blockId,
  events,
  timestamp,
}: ExtrinsicBody): EventHead[] => events.map((event, index) => ({
  event,
  index,
  blockId,
  timestamp,
  extrinsicId: id,
}));

const eventToBody = (nextFreeId: number) => (event: EventHead, index: number): EventBody => ({
  id: nextFreeId + index,
  ...event,
});

// Assigning that the account is active is a temporary solution!
// The correct way would be to first query db if account exists
// If it does not and if transfer has failed then the account is not active.
// The query can be skipped if we would have complete
// list available in function (dynamic programming)
const extractTransferAccounts = ({
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

const isEventStakingReward = ({ event: { event } }: EventHead): boolean => getProvider().api.events.staking.Rewarded.is(event);

const isEventStakingSlash = ({ event: { event } }: EventHead): boolean => getProvider().api.events.staking.Slashed.is(event);

export default async (
  fromId: number,
  toId: number,
): Promise<number> => {
  let transactions = 0;
  const blockIds = range(fromId, toId);
  setResolvingBlocksTillId(toId - 1);

  logger.info('Retrieving block hashes');
  transactions += blockIds.length * 2;
  const hashes = await resolvePromisesAsChunks(blockIds.map(blockHash));
  logger.info('Retrieving block bodies');
  let blocks = await resolvePromisesAsChunks(hashes.map(blockBody));

  // Insert blocks
  logger.info('Inserting initial blocks in DB');
  await insertMultipleBlocks(blocks.map(blockBodyToInsert));

  // Extrinsics
  logger.info('Extracting and compressing blocks extrinsics');
  let extrinsicHeaders = blocks.map(blockToExtrinsicsHeader).flat();

  logger.info('Retrieving next free extrinsic and event ids');
  const [eid, feid] = await nextFreeIds();

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
  logger.info('Extracting transfers');
  let transfers = extrinsics
    .filter(isExtrinsicTransfer)
    .map(extrinsicBodyToTransfer);

  // EVM Calls
  logger.info('Extracting evm calls');
  const extrinsicEvmCalls = extrinsics.filter(isExtrinsicEVMCall);
  let evmCalls = extrinsicEvmCalls.map(extrinsicToEVMCall);

  // Token balance
  logger.info('Retrieving EVM log if contract is ERC20 token');
  const evmLogHeaders = extractEvmLogHeaders(extrinsicEvmCalls);

  transactions += evmLogHeaders.length;
  const evmLogs = await resolvePromisesAsChunks(evmLogHeaders);

  logger.info('Extracting ERC20 transfer events');
  const tokenTransferEvents = extractTokenTransferEvents(evmLogs);

  logger.info('Retrieving ERC20 account token balances');
  transactions += tokenTransferEvents.length;
  const tokenHolders = await resolvePromisesAsChunks(
    tokenTransferEvents.map(extractTokenBalance),
  );

  logger.info('Compressing transfer, event accounts, evm claim account');
  const allAccounts: AccountHead[][] = [];
  allAccounts.push(...transfers.map(extractTransferAccounts));
  allAccounts.push(...events.map(accountNewOrKilled));
  allAccounts.push(...tokenHolders.map(tokenHolderToAccount));
  allAccounts.push(
    ...extrinsics
      .filter(isExtrinsicEvmClaimAccount)
      .map(extrinsicToEvmClaimAccount),
  );

  // Accounts
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

  logger.info('Inserting evm calls');
  await insertEvmCalls(evmCalls);

  // Contracts
  logger.info('Extracting new contracts');
  let contracts = extrinsics
    .filter(isExtrinsicEVMCreate)
    .map(extrinsicToContract);
  logger.info('Inserting contracts');
  await insertContracts(contracts);
  contracts = [];

  logger.info('Inserting token balances');
  await insertAccountTokenBalances(tokenHolders);

  evmCalls = [];

  logger.info('Finalizing blocks');
  await updateBlockFinalized(fromId, toId);
  return transactions;
};
