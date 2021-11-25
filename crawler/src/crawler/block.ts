import { nodeProvider, nodeQuery } from "../utils/connector";
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
  nodeTime: number;
  processingTime: number;

  pt1: number;
  pt2: number;
  pt3: number;
  pt4: number;
  pt5: number;
}

const defaultPerofmance = (): Performance => ({
  nodeTime: 0,
  processingTime: 0,
  pt1: 0,
  pt2: 0,
  pt3: 0,
  pt4: 0,
  pt5: 0,
  transactions: 0
});

export const processBlocks = async (fromId: number, toId: number): Promise<Performance> => {
  // console.log(`Processing blocks from ${fromId} to ${toId}`);
  const blockIds = range(fromId, toId);
  let per = defaultPerofmance();
  per.transactions = blockIds.length * 2;
  
  let st = Date.now();
  let hashes = await Promise.all(blockIds.map(blockHash));
  let blocks = await Promise.all(hashes.map(blockBody));
  per.nodeTime += Date.now() - st;

// Free memory
  hashes = []; 
  // Insert blocks
  await insertMultipleBlocks(blocks.map(blockBodyToInsert));
  per.transactions += 1;
  per.pt1 = Date.now() - st;

  // Extrinsics
  let pt2 = Date.now();
  let extrinsicHeaders = compress(blocks.map(blockToExtrinsicsHeader));
  const [eid, feid] = await nextFreeIds();

  per.transactions += 1 + extrinsicHeaders.length;
  st = Date.now();
  let extrinsics = await Promise.all(extrinsicHeaders.map(extrinsicBody(feid)));
  per.nodeTime += Date.now() - st;

  // Free memory
  blocks = [];
  extrinsicHeaders = [];

  per.transactions += 1;
  await insertExtrinsics(extrinsics.map(extrinsicToInsert));
  per.pt2 = Date.now() - pt2;

  // Events
  let pt3 = Date.now();
  let events = compress(extrinsics.map(extrinsicToEventHeader));

  per.transactions += 1;
  await insertEvents(events.map(eventToInsert(eid)));
  per.pt3 = Date.now() - pt3;

  let pt4 = Date.now();
  let accountHeads = dropDuplicates(compress(events.map(resolveAccounts)), 'address');

  per.transactions += accountHeads.length;
  let accounts = await Promise.all(accountHeads.map(accountHeadToBody));
  await insertAccounts(accounts);
  per.pt4 = Date.now() - pt4;

  // Free memory
  events = [];
  accounts = [];
  accountHeads = [];
  let pt5 = Date.now();
  // Transfers
  let transfers = extrinsics
    .filter(isExtrinsicTransfer)
    .map(extrinsicBodyToTransfer);
  await insertTransfers(transfers);
  per.transactions += 1;
  transfers = [];

  // Contracts
  let contracts = extrinsics
    .filter(isExtrinsicEVMCreate)
    .map(extrinsicToContract)
  await insertContracts(contracts)
  per.transactions += 1;
  contracts = [];

  // EVM Calls
  let evmCalls = extrinsics
    .filter(isExtrinsicEVMCall)
    .map(extrinsicToEVMCall)
  await insertEvmCalls(evmCalls);
  per.transactions += 1;
  evmCalls = [];

  await updateBlockFinalized(fromId, toId);
  per.transactions += 1;
  per.pt5 = Date.now() - pt5;
  return per;
}