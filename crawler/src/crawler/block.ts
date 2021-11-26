import { nodeProvider, nodeQuery, setResolvingBlocksTillId } from "../utils/connector";
import { insertInitialBlock, blockFinalized, insertMultipleBlocks, updateBlockFinalized } from "../queries/block";
import { extrinsicBodyToTransfer, extrinsicStatus, isExtrinsicTransfer, processBlockExtrinsic, resolveSigner } from "./extrinsic";
import type { BlockHash as BH } from '@polkadot/types/interfaces/chain';
import type { SignedBlock } from '@polkadot/types/interfaces/runtime';
import type { HeaderExtended } from '@polkadot/api-derive/type/types';
import {Vec} from "@polkadot/types"
import {Event, EventHead, ExtrinsicBody, ExtrinsicHead, SignedExtrinsicData} from "./types";
import { freeEventId, freeExtrinsicId, InsertExtrinsicBody, insertExtrinsics, insertTransfers, nextFreeIds } from "../queries/extrinsic";
import { insertAccounts, insertEvents, InsertEventValue } from "../queries/event";
import { accountHeadToBody, resolveAccounts } from "./event";
import { compress, dropDuplicates, range } from "../utils/utils";
import { extrinsicToContract, extrinsicToEVMCall, isExtrinsicEVMCall, isExtrinsicEVMCreate } from "./evmEvent";
import { insertContracts, insertEvmCalls } from "../queries/evmEvent";

// export const processBlock = async (id: number): Promise<void> => {
//   // console.log(id)
//   const hash = await nodeProvider.api.rpc.chain.getBlockHash(id);
  
//   const [signedBlock, extendedHeader, events, [, freeExtrinsicId]] = await Promise.all([
//     nodeProvider.api.rpc.chain.getBlock(hash),
//     nodeProvider.api.derive.chain.getHeader(hash),
//     nodeProvider.api.query.system.events.at(hash),
//     nextFreeIds()
//   ]);

//   const {block, } = signedBlock;
//   const {header, extrinsics} = block;
  
//   const body = {
//     id,
//     hash: hash.toString(),
//     author: extendedHeader?.author?.toString() || "",
//     parentHash: header.parentHash.toString(),
//     stateRoot: header.stateRoot.toString(),
//     extrinsicRoot: header.extrinsicsRoot.toString(),
//   };
//   await insertInitialBlock(body);

//   const processExtrinsic = processBlockExtrinsic(id, events, freeExtrinsicId);
//   await Promise.all(extrinsics.map(processExtrinsic));

//   await blockFinalized(id);
// };


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
  // const hash = await nodeProvider.api.rpc.chain.getBlockHash(id);
  const hash = await nodeQuery((provider) => provider.api.rpc.chain.getBlockHash(id));
  return {id, hash}
};

const blockBody = async ({id, hash}: BlockHash): Promise<BlockBody> => {
  const [signedBlock, extendedHeader, events] = await Promise.all([
    // await nodeProvider.api.rpc.chain.getBlock(hash),
    // await nodeProvider.api.derive.chain.getHeader(hash),
    // await nodeProvider.api.query.system.events.at(hash),
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
  .map((event) => ({
    blockId,
    extrinsicId: id,
    event
  }));

const eventToInsert = (nextFreeId: number) => ({event, extrinsicId, blockId}: EventHead, index: number): InsertEventValue => ({
  extrinsicId, blockId, index,
  id: nextFreeId + index,
  data: JSON.stringify(event.event.data.toJSON()),
  method: event.event.method,
  section: event.event.section
});


interface Performance {
  transactions: number;
  dbTime: number;
  nodeTime: number;
  processingTime: number;
}

const defaultPerofmance = (): Performance => ({
  nodeTime: 0,
  dbTime: 0,
  processingTime: 0,
  transactions: 0,
});

export const processBlocks = async (fromId: number, toId: number): Promise<Performance> => {
  // console.log(`Processing blocks from ${fromId} to ${toId}`);
  const blockIds = range(fromId, toId);
  let per = defaultPerofmance();
  setResolvingBlocksTillId(toId-1);
  per.transactions = blockIds.length * 2;
  
  let st = Date.now();
  let hashes = await Promise.all(blockIds.map(blockHash));
  let blocks = await Promise.all(hashes.map(blockBody));
  per.nodeTime += Date.now() - st;

// Free memory
  hashes = []; 
  // Insert blocks
  st = Date.now();
  await insertMultipleBlocks(blocks.map(blockBodyToInsert));
  per.dbTime += Date.now() - st;
  per.transactions += 1;

  // Extrinsics
  st = Date.now();
  let extrinsicHeaders = compress(blocks.map(blockToExtrinsicsHeader));
  per.transactions += 1 + extrinsicHeaders.filter((e) => e.extrinsic.isSigned).length;
  per.processingTime += Date.now() - st;
  const [eid, feid] = await nextFreeIds();
  
  st = Date.now();
  let extrinsics = await Promise.all(extrinsicHeaders.map(extrinsicBody(feid)));
  per.nodeTime += Date.now() - st + 0;
  
  // Free memory
  blocks = [];
  extrinsicHeaders = [];
  
  st = Date.now();
  await insertExtrinsics(extrinsics.map(extrinsicToInsert));
  per.dbTime += Date.now() - st;
  per.transactions += 1;
  
  // Events
  st = Date.now();
  let events = compress(extrinsics.map(extrinsicToEventHeader));
  per.processingTime += Date.now() - st;

  st = Date.now();
  await insertEvents(events.map(eventToInsert(eid)));
  per.transactions += 1;
  per.dbTime += Date.now() - st;
  
  st = Date.now();
  let accountHeads = dropDuplicates(compress(events.map(resolveAccounts)), 'address');
  per.processingTime += Date.now() - st;
  
  per.transactions += accountHeads.length;
  st = Date.now();
  let accounts = await Promise.all(accountHeads.map(accountHeadToBody));
  per.nodeTime += Date.now() - st;
  st = Date.now();
  await insertAccounts(accounts);
  per.dbTime += Date.now() - st;
  
  // Free memory
  events = [];
  accounts = [];
  accountHeads = [];
  // Transfers
  st = Date.now();
  let transfers = extrinsics
    .filter(isExtrinsicTransfer)
    .map(extrinsicBodyToTransfer);
  per.processingTime += Date.now() - st;
  
  st = Date.now();
  await insertTransfers(transfers);
  per.dbTime += Date.now() - st;
  per.transactions += 1;
  transfers = [];
  
  // Contracts
  st = Date.now();
  let contracts = extrinsics
    .filter(isExtrinsicEVMCreate)
    .map(extrinsicToContract)
  per.processingTime += Date.now() - st;
  st = Date.now();
  await insertContracts(contracts)
  per.dbTime += Date.now() - st;
  per.transactions += 1;
  contracts = [];
  
  // EVM Calls
  st = Date.now();
  let evmCalls = extrinsics
    .filter(isExtrinsicEVMCall)
    .map(extrinsicToEVMCall)
  per.processingTime += Date.now() - st;
  st = Date.now();
  await insertEvmCalls(evmCalls);
  per.dbTime += Date.now() - st;
  per.transactions += 1;
  evmCalls = [];
  
  st = Date.now();
  await updateBlockFinalized(fromId, toId);
  per.dbTime += Date.now() - st;
  per.transactions += 1;
  return per;
}