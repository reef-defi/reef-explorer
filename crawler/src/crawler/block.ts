import { nodeProvider } from "../utils/connector";
import { insertInitialBlock, blockFinalized, insertMultipleBlocks } from "../queries/block";
import { processBlockExtrinsic } from "./extrinsic";
import type { BlockHash as BH } from '@polkadot/types/interfaces/chain';
import type { AccountId, BlockNumber, H160, H256, H64, Hash, Header, Index, Justification, KeyValue, SignedBlock, StorageData } from '@polkadot/types/interfaces/runtime';
import type { HeaderExtended } from '@polkadot/api-derive/type/types';
import {Vec} from "@polkadot/types"
import {Event} from "./types";

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


export const processBlocks = async (fromId: number, toId: number): Promise<void> => {
  const blockIds = new Array(toId-fromId)
    .map((_, index) => fromId + index);

  const hashes = await Promise.all(blockIds.map(blockHash));
  const blocks = await Promise.all(hashes.map(blockBody));

  // Insert blocks
  await insertMultipleBlocks(
    blocks.map(({id, hash, extendedHeader, signedBlock}) => ({id, 
      finalized: true,
      hash: hash.toString(),
      author: extendedHeader?.author?.toString() || "",
      parentHash: signedBlock.block.header.parentHash.toString(),
      stateRoot: signedBlock.block.header.stateRoot.toString(),
      extrinsicRoot: signedBlock.block.header.extrinsicsRoot.toString(),
    }))
  )

}