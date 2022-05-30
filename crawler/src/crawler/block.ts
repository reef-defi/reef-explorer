import { nodeProvider } from '../utils/connector';
import { insertMultipleBlocks, updateBlockFinalized } from '../queries/block';
import {
  extrinsicStatus,
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
  accountHeadToBody,
  accountNewOrKilled,
  extrinsicToEventHeader,
  isEventStakingReward,
  isExtrinsicEvent,
} from './event';
import { range, dropDuplicates, resolvePromisesAsChunks } from '../utils/utils';
import {
  extrinsicToContract,
  extrinsicToEvmClaimAccount,
  isExtrinsicEvmClaimAccount,
  isExtrinsicEVMCreate,
  extrinsicToEvmLogs,
} from './evmEvent';
import { insertContracts, insertEvmEvents } from '../queries/evmEvent';
import logger from '../utils/logger';
import { insertStaking, processStakingEvent, stakingToAccount } from './staking';
import insertTokenHolders from '../queries/tokenHoldes';
import {
  extractTransferAccounts, processTokenTransfers, isTransferEvent, processTransferEvent,
} from './transfer';
import {
  processEvmTokenHolders,
  processNativeTokenHolders,
} from './tokenHolder';

const blockHash = async (id: number): Promise<BlockHash> => {
  const hash = await nodeProvider.query((provider) => provider.api.rpc.chain.getBlockHash(id));
  return { id, hash };
};

const blockBody = async ({ id, hash }: BlockHash): Promise<BlockBody> => {
  const provider = nodeProvider.getProvider();
  const [signedBlock, extendedHeader, events] = await Promise.all([
    provider.api.rpc.chain.getBlock(hash),
    provider.api.derive.chain.getHeader(hash),
    provider.api.query.system.events.at(hash),
  ]);

  // Parse the timestamp from the `timestamp.set` extrinsic
  const firstExtrinsic = signedBlock.block.extrinsics[0];

  let timestamp;
  if (
    firstExtrinsic
    && firstExtrinsic.method.section === 'timestamp'
    && firstExtrinsic.method.method === 'set'
  ) {
    timestamp = new Date(Number(firstExtrinsic.method.args)).toUTCString();
  } else {
    timestamp = await provider.api.query.timestamp.now.at(hash);
    timestamp = new Date(timestamp.toJSON()).toUTCString();
  }

  return {
    id,
    hash,
    signedBlock,
    extendedHeader,
    events,
    timestamp,
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
  signedData: extrinsicHead.extrinsic.isSigned
    ? await getSignedExtrinsicData(extrinsicHead.extrinsic.toHex())
    : undefined,
});

const extrinsicToInsert = ({
  id,
  extrinsic,
  signedData,
  blockId,
  events,
  timestamp,
  index,
}: ExtrinsicBody): InsertExtrinsicBody => {
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

const initialBlockToInsert = ({ id, hash }: BlockHash) => ({
  id,
  finalized: false,
  hash: hash.toString(),
  timestamp: `${new Date().toUTCString()}`,
  author: '',
  parentHash: '',
  stateRoot: '',
  extrinsicRoot: '',
});

export const processInitialBlocks = async (
  fromId: number,
  toId: number,
): Promise<number> => {
  if (toId - fromId <= 0) {
    return 0;
  }

  logger.info(`New unfinalized heads detected from ${fromId} to ${toId}`);

  let transactions = 0;
  const blockIds = range(fromId, toId);
  nodeProvider.setDbBlockId(toId - 1);

  logger.info('Retrieving unfinished block hashes');
  transactions += blockIds.length;
  const hashes = await resolvePromisesAsChunks(blockIds.map(blockHash));

  // Insert blocks
  logger.info('Inserting unfinished blocks in DB');
  await insertMultipleBlocks(hashes.map(initialBlockToInsert));
  return transactions;
};

export default async (fromId: number, toId: number, save = true): Promise<number> => {
  let transactions = 0;
  const blockIds = range(fromId, toId);
  nodeProvider.setDbBlockId(toId - 1);

  logger.info('Retrieving block hashes');
  transactions += blockIds.length * 2;

  const provider = nodeProvider.getProvider();
  const blockHashes = await Promise.all(
    blockIds.map((id) => provider.api.rpc.chain.getBlockHash(id)),
  );
  const hashes = blockIds.map((id, i) => ({
    id,
    hash: blockHashes[i],
  }));

  logger.info('Retrieving block bodies');
  let blocks = await Promise.all(hashes.map(blockBody));

  // Insert blocks
  if (save) {
    logger.info('Inserting initial blocks in DB');
    await insertMultipleBlocks(blocks.map(blockBodyToInsert));
  }

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

  // Events
  logger.info('Extracting and compressing extrinisc events');
  const events = extrinsics
    .flatMap(extrinsicToEventHeader)
    .map(eventToBody(eid));

  if (save) {
    logger.info('Inserting extriniscs');
    await insertExtrinsics(extrinsics.map(extrinsicToInsert));
    logger.info('Inserting events');
    await insertEvents(events);
  }

  // Staking
  logger.info('Resolving staking events');
  const staking = await resolvePromisesAsChunks(
    events
      .filter(isEventStakingReward)
      .map((e) => processStakingEvent({
        ...e,
        data: [
          e.event.event.data[0].toString(),
          e.event.event.data[1].toString(),
        ],
      })),
  );

  // Transfers
  logger.info('Extracting native transfers');
  let transfers = await resolvePromisesAsChunks(
    events.filter(isTransferEvent).map(processTransferEvent),
  );

  // EVM Logs
  logger.info('Retrieving EVM log if contract is ERC20 token');
  const evmLogs = await extrinsicToEvmLogs(extrinsics);
  transactions += evmLogs.length;

  // Token Transfers
  logger.info('Extracting token transfer');
  let tokenTransfers = await processTokenTransfers(evmLogs);
  transactions += tokenTransfers.length;
  transfers.push(...tokenTransfers);
  tokenTransfers = [];

  // Evm Token Holders
  logger.info('Extracting EVM token holders');
  const tokenHolders = await processEvmTokenHolders(evmLogs);
  transactions += tokenHolders.length;

  // Accounts
  logger.info('Compressing transfer, event accounts, evm claim account');
  const allAccounts: AccountHead[] = [];
  allAccounts.push(...transfers.flatMap(extractTransferAccounts));
  allAccounts.push(...events.flatMap(accountNewOrKilled));
  allAccounts.push(...staking.map(stakingToAccount));
  allAccounts.push(
    ...extrinsics
      .filter(isExtrinsicEvmClaimAccount)
      .flatMap(extrinsicToEvmClaimAccount),
  );

  logger.info('Extracting, compressing and dropping duplicate accounts');
  let insertOrDeleteAccount = dropDuplicates(allAccounts, 'address').filter(
    ({ address }) => address.length === 48,
  );

  logger.info('Retrieving used account info');
  transactions += insertOrDeleteAccount.length;
  let accounts = await resolvePromisesAsChunks(
    insertOrDeleteAccount.map(accountHeadToBody),
  );
  insertOrDeleteAccount = [];

  // Native token holders
  logger.info('Extracting native token holders from accounts');
  tokenHolders.push(...processNativeTokenHolders(accounts));

  if (save) {
    logger.info('Inserting or updating accounts');
    await insertAccounts(accounts);
    // Free memory
    accounts = [];

    // Staking Reward
    logger.info('Inserting staking rewards');
    await insertStaking(staking);

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
  }

  logger.info('Complete!');
  return transactions;
};
