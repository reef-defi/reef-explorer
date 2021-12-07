import {Vec} from "@polkadot/types"
import {SpRuntimeDispatchError} from "@polkadot/types/lookup"
import {BigNumber} from "ethers";
import { Extrinsic, Event, ExtrinsicStatus, SignedExtrinsicData, ExtrinsicBody, Transfer, ResolveSection } from "./types";
import { processNewContract, processUnverifiedEvmCall } from "./evmEvent";
import { insertTransfer, insertExtrinsic, InsertExtrinsicBody, freeEventId } from "../queries/extrinsic";
import { getProvider, nodeQuery } from "../utils/connector";


// interface ProcessTransfer {
//   blockId: number;
//   extrinsicId: number;
//   extrinsic: Extrinsic;
//   status: ExtrinsicStatus;
//   signedData: SignedExtrinsicData;
// }

export const resolveSigner = (extrinsic: Extrinsic): string => extrinsic.signer?.toString() || 'deleted';

// const getSignedExtrinsicData = async (extrinsicHash: string): Promise<SignedExtrinsicData> => {
//   const [fee, feeDetails] = await Promise.all([
//     nodeQuery((provider) => provider.api.rpc.payment.queryInfo(extrinsicHash)),
//     nodeQuery((provider) => provider.api.rpc.payment.queryFeeDetails(extrinsicHash)),
//   ]);
  
//   return {
//     fee: fee.toJSON(),
//     feeDetails: feeDetails.toJSON(),
//   };
// }

const extractErrorMessage = (error: SpRuntimeDispatchError): string => {
  if (error.isModule) {
    const decoded = getProvider().api.registry.findMetaError(error.asModule);
    return `${decoded.section}.${decoded.name}`;
  } else {
    return error.toString();
  }
}

export const extrinsicStatus = (extrinsicEvents: Event[]): ExtrinsicStatus => extrinsicEvents
  .reduce((prev, {event}) => {
      if (prev.type === 'unknown' && getProvider().api.events.system.ExtrinsicSuccess.is(event)) {
        return {type: "success"};
      } else if (getProvider().api.events.system.ExtrinsicFailed.is(event)) {
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

// const processTransfer = async ({blockId, extrinsic, extrinsicId, status, signedData}: ProcessTransfer) => {
//   const args: any = extrinsic.args.map((arg) => arg.toJSON());
  
//   const toAddress = args[0]?.id || 'deleted';
//   const fromAddress = resolveSigner(extrinsic);

//   const denom: string = extrinsic.method.section === 'currencies' ? args[1].token : 'REEF';
//   const amount: string = BigNumber.from(
//     extrinsic.method.section === 'currencies' ? args[2] : args[1]
//   ).toString();
//   const success = status.type === "success";

//   await insertTransfer({
//     denom,
//     amount,
//     blockId,
//     success,
//     toAddress,
//     extrinsicId,
//     fromAddress,
//     feeAmount: signedData.fee.partialFee,
//     errorMessage: status.type === "error" ? status.message : "",
//   })
//   console.log(`Block: ${blockId} -> New Transfer from ${fromAddress} to ${toAddress} with amount ${amount} ${success ? "succsessfull" : "unsuccsessfull"}`)
// }


// const processExtrinsicInsert = async (id:number, extrinsic: Extrinsic, blockId: number, index: number, status: ExtrinsicStatus, signedData?: SignedExtrinsicData): Promise<void> => {
//   const {meta, hash, args, method} = extrinsic;

//   const extrinsicBody: InsertExtrinsicBody = {
//     id,
//     index,
//     blockId,
//     signedData,
//     status: status.type,
//     hash: hash.toString(),
//     method: method.method,
//     section: method.section,
//     signed: resolveSigner(extrinsic),
//     args: JSON.stringify(args),
//     docs: meta.docs.toLocaleString(),
//     error_message: status.type === 'error' ? status.message : ""
//   }
  
//   return insertExtrinsic(extrinsicBody);
// }

// const resolveEvmSection = async (section: ResolveSection): Promise<void> => {
//   if (section.extrinsic.method.method === "create") {
//     await processNewContract(section)
//   } else {
//     await processUnverifiedEvmCall(section);
//   } 
// }

// const resolveSections = async (section: ResolveSection): Promise<void> => {
//   switch (section.extrinsic.method.section) {
//     case "balances": return processTransfer(section);
//     case "currencies": return processTransfer(section);
//     case "evm": return resolveEvmSection(section);
//   }
// }

// export const processBlockExtrinsic = (blockId: number, blockEvents: Vec<Event>, freeExtrinsicId: number) => async (extrinsic: Extrinsic, index: number): Promise<void> => {
//   const events = blockEvents
//     .filter(({phase}) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index));

//   const status = extrinsicStatus(events);
//   const signedData = extrinsic.isSigned
//     ? await getSignedExtrinsicData(extrinsic.toHex())
//     : undefined;
//   const id = freeExtrinsicId+index
//   await processExtrinsicInsert(id, extrinsic, blockId, index, status, signedData);

//   const feid = await freeEventId();
  
//   const processEvent = processBlockEvent(blockId, id, feid);
//   await Promise.all(events.map(processEvent));

//   if (extrinsic.isSigned) {
//     await resolveSections({extrinsicId: id, extrinsic, blockId, signedData: signedData!, status, extrinsicEvents: events});
//   }
// }

// New
export const isExtrinsicTransfer = ({extrinsic}: ExtrinsicBody): boolean => 
     extrinsic.method.section === "balances" 
  || extrinsic.method.section === "currencies"

export const extrinsicBodyToTransfer = ({extrinsic, status, blockId, id, signedData}: ExtrinsicBody): Transfer => {
  const args: any = extrinsic.args.map((arg) => arg.toJSON());
  
  const toAddress = args[0]?.id || 'deleted';
  const fromAddress = resolveSigner(extrinsic);

  const denom: string = extrinsic.method.section === 'currencies' ? args[1].token : 'REEF';
  const amount: string = BigNumber.from(
    extrinsic.method.section === 'currencies' ? args[2] : args[1]
  ).toString();

  return {
    denom,
    amount,
    blockId,
    toAddress,
    fromAddress,
    extrinsicId: id,
    success: status.type === "success",
    feeAmount: signedData!.fee.partialFee,
    errorMessage: status.type === "error" ? status.message : "",
  }
}