import { insertInitialBlock, blockFinalized } from "../queries/block";
import { nodeProvider } from "../utils/connector";

export const processBlock = async (id: number): Promise<void> => {
  const hash = await nodeProvider.api.rpc.chain.getBlockHash(id);
  const header = await nodeProvider.api.derive.chain.getHeader(hash);
  
  const body = {
    id,
    hash: hash.toString(),
    author: header?.author?.toString() || "",
    parentHash: header?.parentHash.toString() || "",
    stateRoot: header?.stateRoot.toString() || "",
    extrinsicRoot: header?.extrinsicsRoot.toString() || "",
  };

  await insertInitialBlock(body)

  // console.log(await query("SELECT * FROM block"));

  await blockFinalized(id);
};
