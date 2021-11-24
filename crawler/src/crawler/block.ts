import { nodeProvider } from "../utils/connector";
import { insertInitialBlock, blockFinalized, insertMultipleBlocks } from "../queries/block";
import { extrinsicStatus, processBlockExtrinsic, resolveSigner } from "./extrinsic";
import type { BlockHash as BH } from '@polkadot/types/interfaces/chain';
import type { SignedBlock } from '@polkadot/types/interfaces/runtime';
import type { HeaderExtended } from '@polkadot/api-derive/type/types';
import {Vec} from "@polkadot/types"
import {Event, EventHead, ExtrinsicBody, ExtrinsicHead, SignedExtrinsicData} from "./types";
import { compress } from "./utils";
import { InsertExtrinsic, InsertExtrinsicBody, insertExtrinsics } from "../queries/extrinsic";
import { insertAccounts, insertEvents, InsertEventValue } from "../queries/event";
import { accountHeadToBody, resolveAccounts } from "./event";

export const processBlock = async (id: number): Promise<void> => {
  // console.log(id)
  const hash = await nodeProvider.api.rpc.chain.getBlockHash(id);
  
  const [signedBlock, extendedHeader, events] = await Promise.all([
    await nodeProvider.api.rpc.chain.getBlock(hash),
    // TODO why the f*** next function shows 'Unable to map u16 to a lookup index'?!?!?!?!
    await nodeProvider.api.derive.chain.getHeader(hash),
    await nodeProvider.api.query.system.events.at(hash),
  ]);

  const {block, } = signedBlock;
  const {header, extrinsics} = block;
  
  const body = {
    id,
    hash: hash.toString(),
    author: extendedHeader?.author?.toString() || "",
    parentHash: header.parentHash.toString(),
    stateRoot: header.stateRoot.toString(),
    extrinsicRoot: header.extrinsicsRoot.toString(),
  };
  await insertInitialBlock(body);

  const processExtrinsic = processBlockExtrinsic(id, events);
  await Promise.all(extrinsics.map(processExtrinsic));

  await blockFinalized(id);
};


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
  const hash = await nodeProvider.api.rpc.chain.getBlockHash(id);
  return {id, hash}
};

const blockBody = async ({id, hash}: BlockHash): Promise<BlockBody> => {
  const [signedBlock, extendedHeader, events] = await Promise.all([
    await nodeProvider.api.rpc.chain.getBlock(hash),
    await nodeProvider.api.derive.chain.getHeader(hash),
    await nodeProvider.api.query.system.events.at(hash),
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

const blockToExtrinsicsHeader = (nextFreeId: number) => ({id, signedBlock, events}: BlockBody, index: number): ExtrinsicHead[] => 
  signedBlock.block.extrinsics
    .map((extrinsic, index) => ({
      extrinsic,
      blockId: id,
      id: nextFreeId + index,
      events: events.filter(isExtrinsicEvent(index)),
    }));

const getSignedExtrinsicData = async (extrinsicHash: string): Promise<SignedExtrinsicData> => {
  const [fee, feeDetails] = await Promise.all([
    nodeProvider.api.rpc.payment.queryInfo(extrinsicHash),
    nodeProvider.api.rpc.payment.queryFeeDetails(extrinsicHash),
  ]);
  
  return {
    fee: fee.toJSON(),
    feeDetails: feeDetails.toJSON(),
  };
}

const extrinsicBody = async (extrinsicHead: ExtrinsicHead): Promise<ExtrinsicBody> => ({...extrinsicHead,
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

const extrinsicToEventHeader = (nextFreeId: number) =>  ({id, blockId, extrinsic, events}: ExtrinsicBody, index: number): EventHead[] => events
  .map((event) => ({
    blockId,
    extrinsicId: id,
    id: nextFreeId + index,
    event
  }));

const eventToInsert = ({id, event, extrinsicId, blockId}: EventHead, index: number): InsertEventValue => ({
  id, extrinsicId, blockId, index,
  data: JSON.stringify(event.event.data.toJSON()),
  method: event.event.method,
  section: event.event.section
});

export const processBlocks = async (fromId: number, toId: number): Promise<void> => {
  const blockIds = new Array(toId-fromId)
    .map((_, index) => fromId + index);

  let hashes = await Promise.all(blockIds.map(blockHash));
  let blocks = await Promise.all(hashes.map(blockBody));
// Free memory
  hashes = []; 
  // Insert blocks
  await insertMultipleBlocks(blocks.map(blockBodyToInsert));

  // Extrinsics
  let extrinsicHeaders = compress(blocks.map(blockToExtrinsicsHeader(0)));
  let extrinsics = await Promise.all(extrinsicHeaders.map(extrinsicBody));

  // Free memory
  blocks = [];
  extrinsicHeaders = [];

  await insertExtrinsics(extrinsics.map(extrinsicToInsert));

  // Events
  let events = compress(extrinsics.map(extrinsicToEventHeader(0)));
  await insertEvents(events.map(eventToInsert));

  let accountHeads = compress(events.map(resolveAccounts));
  let accounts = await Promise.all(accountHeads.map(accountHeadToBody));
  await insertAccounts(accounts);

  // Free memory
  events = [];
  accounts = [];
  accountHeads = [];

}