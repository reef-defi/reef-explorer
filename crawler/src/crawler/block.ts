import {  getProvider, nodeQuery, query, setResolvingBlocksTillId } from "../utils/connector";
import { insertMultipleBlocks, updateBlockFinalized } from "../queries/block";
import { extrinsicBodyToTransfer, extrinsicStatus, isExtrinsicTransfer, resolveSigner } from "./extrinsic";
import type { BlockHash as BH } from '@polkadot/types/interfaces/chain';
import type { SignedBlock } from '@polkadot/types/interfaces/runtime';
import type { HeaderExtended } from '@polkadot/api-derive/type/types';
import {Vec} from "@polkadot/types"
import {ABI, ABIS, AccountTokenBalance, Event, EventBody, EventHead, ExtrinsicBody, ExtrinsicHead, SignedExtrinsicData} from "./types";
import { InsertExtrinsicBody, insertExtrinsics, insertTransfers, nextFreeIds } from "../queries/extrinsic";
import { insertAccounts, insertEvents } from "../queries/event";
import { accountHeadToBody, accountNewOrKilled } from "./event";
import { compress, dropDuplicates, dropDuplicatesMultiKey, range, resolvePromisesAsChunks } from "../utils/utils";
import { extrinsicToContract, extrinsicToEVMCall, isExtrinsicEVMCall, isExtrinsicEVMCreate } from "./evmEvent";
import { findErc20TokenDB, insertAccountTokenBalances, insertContracts, insertEvmCalls } from "../queries/evmEvent";
import {utils, Contract} from "ethers";
import { logger } from "../utils/logger";
import { insertStakingReward, insertStakingSlash } from "../queries/staking";

interface BlockHash {
  id: number;
  hash: BH;
}

interface BlockBody extends BlockHash {
  signedBlock: SignedBlock;
  extendedHeader?: HeaderExtended;
  events: Vec<Event>;
}

const blockHash = async (id: number): Promise<BlockHash> => {
  const hash = await nodeQuery((provider) => provider.api.rpc.chain.getBlockHash(id));
  return {id, hash}
};

const blockBody = async ({id, hash}: BlockHash): Promise<BlockBody> => {
  const [signedBlock, extendedHeader, events] = await Promise.all([
    nodeQuery((provider) => provider.api.rpc.chain.getBlock(hash)),
    nodeQuery((provider) => provider.api.derive.chain.getHeader(hash)),
    nodeQuery((provider) => provider.api.query.system.events.at(hash)),
  ]);
  return {id, hash, signedBlock, extendedHeader, events}
}

const blockBodyToInsert = ({id, hash, extendedHeader, signedBlock}: BlockBody) => ({id, 
  finalized: true,
  hash: hash.toString(),
  author: extendedHeader?.author?.toString() || "",
  parentHash: signedBlock.block.header.parentHash.toString(),
  stateRoot: signedBlock.block.header.stateRoot.toString(),
  extrinsicRoot: signedBlock.block.header.extrinsicsRoot.toString(),
})

const isExtrinsicEvent = (extrinsicIndex: number) => ({phase}: Event): boolean => 
  phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(extrinsicIndex)

const blockToExtrinsicsHeader = ({id, signedBlock, events}: BlockBody): ExtrinsicHead[] => 
  signedBlock.block.extrinsics
    .map((extrinsic, index) => ({
      extrinsic,
      blockId: id,
      events: events.filter(isExtrinsicEvent(index)),
      status: extrinsicStatus(events)
    }));

const getSignedExtrinsicData = async (extrinsicHash: string): Promise<SignedExtrinsicData> => {
  const [fee, feeDetails] = await Promise.all([
    // nodeProvider.api.rpc.payment.queryInfo(extrinsicHash),
    // nodeProvider.api.rpc.payment.queryFeeDetails(extrinsicHash),
    nodeQuery((provider) => provider.api.rpc.payment.queryInfo(extrinsicHash)),
    nodeQuery((provider) => provider.api.rpc.payment.queryFeeDetails(extrinsicHash)),
  ]);
  
  return {
    fee: fee.toJSON(),
    feeDetails: feeDetails.toJSON(),
  };
}

const extrinsicBody = (nextFreeId: number) => async (extrinsicHead: ExtrinsicHead, index: number): Promise<ExtrinsicBody> => ({...extrinsicHead,
  id: nextFreeId + index,
  signedData: extrinsicHead.extrinsic.isSigned ? await getSignedExtrinsicData(extrinsicHead.extrinsic.toHex()) : undefined
})

const extrinsicToInsert = ({id, extrinsic, signedData, blockId, events}: ExtrinsicBody, index: number): InsertExtrinsicBody => {
  const status = extrinsicStatus(events);
  const {hash, method, args, meta} = extrinsic;
  return {
    id,
    index,
    blockId,
    signedData,
    status: status.type,
    hash: hash.toString(),
    method: method.method,
    section: method.section,
    signed: resolveSigner(extrinsic),
    args: JSON.stringify(args),
    docs: meta.docs.toLocaleString(),
    error_message: status.type === 'error' ? status.message : "",
  }
};

const extrinsicToEventHeader = ({id, blockId, events}: ExtrinsicBody): EventHead[] => events
  .map((event, index) => ({
    blockId,
    index,
    extrinsicId: id,
    event
  }));

const eventToBody = (nextFreeId: number) =>  (event: EventHead, index: number): EventBody => ({
  id: nextFreeId + index,
  ...event
});

const isEventStakingReward = ({event: {event}}: EventHead): boolean => 
  getProvider().api.events.staking.Rewarded.is(event)
  
const isEventStakingSlash = ({event: {event}}: EventHead): boolean => 
  getProvider().api.events.staking.Slashed.is(event)

export const processBlocks = async (fromId: number, toId: number): Promise<number> => {
  // console.log(`Processing blocks from ${fromId} to ${toId}`);
  let transactions = 0;
  const blockIds = range(fromId, toId);
  setResolvingBlocksTillId(toId-1);
  
  logger.info("Retrieving block hashes")
  transactions += blockIds.length * 2;
  let hashes = await resolvePromisesAsChunks(blockIds.map(blockHash));
  logger.info("Retrieving block bodies")
  let blocks = await resolvePromisesAsChunks(hashes.map(blockBody));
  
  // Free memory
  hashes = []; 
  // Insert blocks
  logger.info("Inserting initial blocks in DB")
  await insertMultipleBlocks(blocks.map(blockBodyToInsert));
  
  // Extrinsics
  logger.info("Extracting and compressing blocks extrinsics");
  let extrinsicHeaders = compress(blocks.map(blockToExtrinsicsHeader));
  
  logger.info("Retrieving next free extrinsic and event ids");
  const [eid, feid] = await nextFreeIds();
  
  logger.info("Retrieving neccessery extrinsic data");
  transactions += extrinsicHeaders.length;
  let extrinsics = await resolvePromisesAsChunks(extrinsicHeaders.map(extrinsicBody(feid)));
  
  // Free memory
  blocks = [];
  extrinsicHeaders = [];
  
  logger.info("Inserting extriniscs");
  await insertExtrinsics(extrinsics.map(extrinsicToInsert));
  
  // Events
  logger.info("Extracting and compressing extrinisc events");
  let events = compress(extrinsics.map(extrinsicToEventHeader))
    .map(eventToBody(eid))
  
  logger.info("Inserting events");
  await insertEvents(events);
  
  // Accounts
  logger.info("Extracting, compressing and dropping duplicate accounts");
  let insertOrDeleteAccount = dropDuplicates(compress(events.map(accountNewOrKilled)), 'address')
  
  logger.info("Retrieving used account info");
  transactions += insertOrDeleteAccount.length;
  let accounts = await resolvePromisesAsChunks(insertOrDeleteAccount.map(accountHeadToBody));
  logger.info("Inserting or updating accounts");
  await insertAccounts(accounts);
  // Free memory
  accounts = [];
  insertOrDeleteAccount = [];
  
  // Staking Slash
  logger.info("Inserting staking slashes");
  await insertStakingSlash(events.filter(isEventStakingSlash));
  
  // Staking Reward
  logger.info("Inserting staking rewards");
  await insertStakingReward(events.filter(isEventStakingReward));
    
  // Transfers
  logger.info("Extracting transfers");
  let transfers = extrinsics
    .filter(isExtrinsicTransfer)
    .map(extrinsicBodyToTransfer);
  
  logger.info("Inserting transfers");
  await insertTransfers(transfers);
  transfers = [];
  
  // Contracts
  logger.info("Extracting new contracts");
  let contracts = extrinsics
    .filter(isExtrinsicEVMCreate)
    .map(extrinsicToContract)
  logger.info("Inserting contracts");
  await insertContracts(contracts)
  contracts = [];
  
  // EVM Calls
  logger.info("Extracting evm calls");
  const extrinsicEvmCalls = extrinsics
  .filter(isExtrinsicEVMCall)
  let evmCalls = extrinsicEvmCalls
  .map(extrinsicToEVMCall)

  logger.info("Inserting evm calls");
  await insertEvmCalls(evmCalls);
  
  // Token balance
  logger.info("Retrieving EVM log if contract is ERC20 token");
  const evmLogHeaders = compress(extrinsicEvmCalls.map(({events}) => events))
    .filter(({event: {method, section}}) => (method === "Log" && section === "evm"))
    .map(({event}): BytecodeLog => (event.data.toJSON() as any)[0])
    .map(extractEvmLog)

  transactions += evmLogHeaders.length;
  let evmLogs = await resolvePromisesAsChunks(evmLogHeaders);
    
  logger.info("Extracting ERC20 transfer events");
  const tokenTransferEvents = dropDuplicatesMultiKey(compress(evmLogs
    .filter((e) => e !== null)
    .map((e) => decodeEvmLog(e!))
    .filter(({decodedEvent}) => decodedEvent.name === "Transfer")
    .map(erc20TransferEvent)
    ), ["signerAddress", "contractAddress"]);
    
  logger.info("Retrieving ERC20 account token balances");
  transactions += tokenTransferEvents.length;
  const tokenBalances = await resolvePromisesAsChunks(
    tokenTransferEvents.map(extractTokenBalance)
  );
  logger.info("Inserting token balances");
  await insertAccountTokenBalances(tokenBalances);
  
  evmCalls = [];
  
  logger.info("Finalizing blocks");
  await updateBlockFinalized(fromId, toId);
  return transactions;
}
    
interface BytecodeLog {
  address: string;
  data: string;
  topics: string[];
}

interface EvmLog extends BytecodeLog {
  name: string;
  abis:ABIS
  decimals: number;
}

interface EvmLogWithDecodedEvent extends EvmLog {
  decodedEvent: utils.LogDescription
}

interface TokenBalanceHead {
  contractAddress: string;
  signerAddress: string;
  decimals: number;
  abi: ABI;
}

const getContractBalance = (address: string, contractAddress: string, abi: ABI) => nodeQuery(
  async (provider): Promise<string> => {
    const contract = new Contract(contractAddress, abi, provider);
    return await contract.balanceOf(address);
  }
);

const extractEvmLog = async (event: BytecodeLog): Promise<EvmLog|null> => {
  const result = await findErc20TokenDB(event.address);
  if (result.length === 0) { return null; }
  
  return {...event,
    name: result[0].name,
    abis: result[0].compiled_data,
    decimals: result[0].contract_data.decimals,
  }
}

const decodeEvmLog = (event: EvmLog): EvmLogWithDecodedEvent => {
  const {abis, data, name, topics} = event!;
  const abi = new utils.Interface(abis[name]);
  const result = abi.parseLog({topics, data});
  return {...event, 
    decodedEvent: result
  };
}

const erc20TransferEvent = ({address, decimals, decodedEvent, abis, name}: EvmLogWithDecodedEvent): TokenBalanceHead[] => [
  {contractAddress: address, signerAddress: decodedEvent.args[0], decimals, abi: abis[name]},
  {contractAddress: address, signerAddress: decodedEvent.args[1], decimals, abi: abis[name]},
]

const extractTokenBalance = async ({decimals, abi, contractAddress, signerAddress}: TokenBalanceHead): Promise<AccountTokenBalance> => {
  const balance = await getContractBalance(signerAddress, contractAddress, abi);
  return {
    decimals,
    balance,
    accountAddress: signerAddress,
    contractAddress
  }
}