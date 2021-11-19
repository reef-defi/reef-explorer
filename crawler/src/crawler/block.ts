import { insertInitialBlock, blockFinalized, InsertExtrinsic, SignedExtrinsicData, insertExtrinsic } from "../queries/block";
import { nodeProvider } from "../utils/connector";
import {GenericExtrinsic} from "@polkadot/types/extrinsic"
import {AnyTuple} from "@polkadot/types/types"

type Extrinsic = GenericExtrinsic<AnyTuple>;

export const processBlock = async (id: number): Promise<void> => {
  console.log(`Processing block with id: ${id}`);
  const hash = await nodeProvider.api.rpc.chain.getBlockHash(id);
  const signedBlock = await nodeProvider.api.rpc.chain.getBlock(hash);
  // TODO why the f*** next function shows 'Unable to map u16 to a lookup index'?!?!?!?!
  const extendedHeader = await nodeProvider.api.derive.chain.getHeader(hash);

  const {block} = signedBlock;
  const {header, extrinsics} = block;

  const body = {
    id,
    hash: hash.toString(),
    author: extendedHeader?.author?.toString() || "", // TODO for speedup we can remove author 
    parentHash: header?.parentHash.toString() || "",
    stateRoot: header?.stateRoot.toString() || "",
    extrinsicRoot: header?.extrinsicsRoot.toString() || "",
  };
  await insertInitialBlock(body);

  const blockProcessExtrinsic = processExtrinsic(id);
  await Promise.all(extrinsics.map(blockProcessExtrinsic));

  await blockFinalized(id);
};


const getSignedExtrinsicData = async (extrinsicHash: string): Promise<SignedExtrinsicData> => {
  const fee = await nodeProvider.api.rpc.payment.queryInfo(extrinsicHash);
  const feeDetails = await nodeProvider.api.rpc.payment.queryFeeDetails(extrinsicHash);

  return {
    fee: JSON.stringify(fee.toJSON()),
    feeDetails: JSON.stringify(feeDetails.toJSON()),
  };
}

const processExtrinsic = (blockId: number) => async (extrinsic: Extrinsic, index: number): Promise<void> => {
  console.log("Extrinsic id: ", index);
  const {signer, meta, hash, args, method, isSigned} = extrinsic;
  const extrinsicBody: InsertExtrinsic = {
    index,
    method: method.method,
    blockId,
    section: method.section,
    args: args.toLocaleString(),
    signed: signer.toString(),
    hash: hash.toString(),
    docs: meta.docs.toLocaleString(),
  }

  if (isSigned) {
    const signedData = await getSignedExtrinsicData(extrinsic.toHex());
    await insertExtrinsic(extrinsicBody, signedData);
    console.log("Signed data");
    console.log(extrinsicBody)
    process.exit()
  } else {
    await insertExtrinsic(extrinsicBody); 
  }
}
