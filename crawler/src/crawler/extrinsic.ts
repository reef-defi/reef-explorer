import {Vec} from "@polkadot/types"
import {AnyTuple} from "@polkadot/types/types"
import { nodeProvider } from "../utils/connector";
import {GenericExtrinsic} from "@polkadot/types/extrinsic"
import {FrameSystemEventRecord, SpRuntimeDispatchError} from "@polkadot/types/lookup"
import { SignedExtrinsicData, InsertExtrinsic, insertExtrinsic, insertTransfer } from "../queries/block";
import { processExtrinsicEvent } from "./event";
import {BigNumber} from "ethers";

type Extrinsic = GenericExtrinsic<AnyTuple>;

const getSignedExtrinsicData = async (extrinsicHash: string): Promise<SignedExtrinsicData> => {
  const fee = await nodeProvider.api.rpc.payment.queryInfo(extrinsicHash);
  const feeDetails = await nodeProvider.api.rpc.payment.queryFeeDetails(extrinsicHash);

  return {
    fee: fee.toJSON(),
    feeDetails: feeDetails.toJSON(),
  };
}

interface ExtrinsicUnknown {
  type: "unknown";
}
interface ExtrinsicSuccess {
  type: "success";
}
interface ExtrinsicError {
  type: "error";
  message: string;
}

type ExtrinsicStatus = ExtrinsicError | ExtrinsicSuccess | ExtrinsicUnknown;

const extractErrorMessage = (error: SpRuntimeDispatchError): string => {
  if (error.isModule) {
    const decoded = nodeProvider.api.registry.findMetaError(error.asModule);
    return `${decoded.section}.${decoded.name}`;
  } else {
    return error.toString();
  }
}

const extrinsicStatus = (extrinsicEvents: FrameSystemEventRecord[]): ExtrinsicStatus => extrinsicEvents
  .reduce((prev, {event}) => {
      if (prev.type === 'unknown' && nodeProvider.api.events.system.ExtrinsicSuccess.is(event)) {
        return {type: "success"};
      } else if (nodeProvider.api.events.system.ExtrinsicFailed.is(event)) {
        const [dispatchedError] = event.data;
        return {
          type: 'error',
          message: extractErrorMessage(dispatchedError),
        };
      } else {
        return prev;
      }
    }, {type: 'unknown'} as ExtrinsicStatus
  );



interface ProcessTransfer {
  blockId: number;
  extrinsicId: number;
  extrinsic: Extrinsic;
  status: ExtrinsicStatus;
  signedData: SignedExtrinsicData;
}

const processTransfer = async ({blockId, extrinsic, extrinsicId, status, signedData}: ProcessTransfer) => {
  const args: any = extrinsic.args.map((arg) => arg.toJSON());
  
  const toAddress = args[0]!.id;
  const denom: string = extrinsic.method.section === 'currencies' ? args[1].token : 'REEF';
  const amount: string = extrinsic.method.section === 'currencies' ? args[2] : args[1];

  await insertTransfer({
    denom,
    blockId,
    toAddress,
    extrinsicId,
    success: status.type === "success",
    feeAmount: signedData.fee.partialFee,
    fromAddress: extrinsic.signer.toString(),
    amount: BigNumber.from(amount).toString(),
    errorMessage: status.type === "error" ? status.message : "",
  })
}


const processExtrinsicInsert = async (extrinsic: Extrinsic, blockId: number, index: number, status: ExtrinsicStatus): Promise<number> => {
  const {signer, meta, hash, args, method, isSigned} = extrinsic;

  const extrinsicBody: InsertExtrinsic = {
    index,
    blockId,
    status: status.type,
    hash: hash.toString(),
    method: method.method,
    section: method.section,
    signed: signer.toString(),
    args: JSON.stringify(args),
    docs: meta.docs.toLocaleString(),
    error_message: status.type === 'error' ? status.message : ""
  }
  
  if (isSigned) {
    const signedData = await getSignedExtrinsicData(extrinsic.toHex());
    const extrinsicId = await insertExtrinsic(extrinsicBody, signedData);

    if (method.section === 'balances' || method.section === 'currencies') {
      await processTransfer({blockId, extrinsic, extrinsicId, status, signedData})
    }
    return extrinsicId;
  } else {
    return await insertExtrinsic(extrinsicBody); 
  } 
}

export const processBlockExtrinsic = (blockId: number, blockEvents: Vec<FrameSystemEventRecord>) => async (extrinsic: Extrinsic, index: number): Promise<void> => {
  console.log("Extrinsic id: ", index);
  
  const events = blockEvents
    .filter(({phase}) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index));

  const status = extrinsicStatus(events);
  const extrinsicId = await processExtrinsicInsert(extrinsic, blockId, index, status);

  const processEvent = processExtrinsicEvent(blockId, extrinsicId);
  await Promise.all(events.map(processEvent));

  const {section} = extrinsic.method;
}

