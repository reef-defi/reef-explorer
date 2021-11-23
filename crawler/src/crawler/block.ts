import { nodeProvider } from "../utils/connector";
import { insertInitialBlock, blockFinalized } from "../queries/block";
import { processBlockExtrinsic } from "./extrinsic";

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


