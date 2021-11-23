import {Vec} from "@polkadot/types"
import { nodeProvider } from "../utils/connector";
import {SpRuntimeDispatchError} from "@polkadot/types/lookup"
import { SignedExtrinsicData, InsertExtrinsic, insertExtrinsic, insertTransfer, insertUnverifiedEvmCall, signerExist, insertAccount } from "../queries/block";
import {BigNumber} from "ethers";
import { Extrinsic, Event, ExtrinsicStatus } from "./types";
import { processNewContract } from "./contract";
import { processBlockEvent } from "./event";


interface ProcessTransfer {
  blockId: number;
  extrinsicId: number;
  extrinsic: Extrinsic;
  status: ExtrinsicStatus;
  signedData: SignedExtrinsicData;
}

const resolveSigner = (extrinsic: Extrinsic): string => extrinsic.signer?.toString() || 'deleted';

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

const extractErrorMessage = (error: SpRuntimeDispatchError): string => {
  if (error.isModule) {
    const decoded = nodeProvider.api.registry.findMetaError(error.asModule);
    return `${decoded.section}.${decoded.name}`;
  } else {
    return error.toString();
  }
}

const extrinsicStatus = (extrinsicEvents: Event[]): ExtrinsicStatus => extrinsicEvents
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

const processTransfer = async ({blockId, extrinsic, extrinsicId, status, signedData}: ProcessTransfer) => {
  const args: any = extrinsic.args.map((arg) => arg.toJSON());
  
  const toAddress = args[0]?.id || 'deleted';
  const fromAddress = resolveSigner(extrinsic);

  const denom: string = extrinsic.method.section === 'currencies' ? args[1].token : 'REEF';
  const amount: string = BigNumber.from(
    extrinsic.method.section === 'currencies' ? args[2] : args[1]
  ).toString();
  const success = status.type === "success";

  await insertTransfer({
    denom,
    amount,
    blockId,
    success,
    toAddress,
    extrinsicId,
    fromAddress,
    feeAmount: signedData.fee.partialFee,
    errorMessage: status.type === "error" ? status.message : "",
  })
  console.log(`Block: ${blockId} -> New Transfer from ${fromAddress} to ${toAddress} with amount ${amount} ${success ? "succsessfull" : "unsuccsessfull"}`)
}


const processExtrinsicInsert = async (extrinsic: Extrinsic, blockId: number, index: number, status: ExtrinsicStatus, sd?: SignedExtrinsicData): Promise<number> => {
  const {meta, hash, args, method} = extrinsic;

  const extrinsicBody: InsertExtrinsic = {
    index,
    blockId,
    status: status.type,
    hash: hash.toString(),
    method: method.method,
    section: method.section,
    signed: resolveSigner(extrinsic),
    args: JSON.stringify(args),
    docs: meta.docs.toLocaleString(),
    error_message: status.type === 'error' ? status.message : ""
  }
  
  return insertExtrinsic(extrinsicBody, sd);
}

const processUnverifiedEvmCall = async (section: ResolveSection): Promise<void> => {
  const {extrinsic, extrinsicId, status} = section;
  const account = resolveSigner(extrinsic);
  const args: any[] = extrinsic.args.map((arg) => arg.toJSON());
  const contractAddress: string = args[0];
  const data = JSON.stringify(args.slice(0, args.length-2));
  const gasLimit = args.length >= 3 ? args[args.length-2] : 0;
  const storageLimit = args.length >= 3 ? args[args.length-1] : 0;
  await insertUnverifiedEvmCall({
    data,
    status,
    account,
    gasLimit,
    extrinsicId,
    storageLimit,
    contractAddress,
  });
  console.log(`Block: ${section.blockId} -> New Unverified evm call by ${account} ${status.type === 'success' ? 'succsessfull' : 'unsuccsessfull'}`);
}

interface ResolveSection {
  blockId: number;
  extrinsicId: number;
  extrinsic: Extrinsic;
  status: ExtrinsicStatus;
  extrinsicEvents: Event[];
  signedData: SignedExtrinsicData;
}

const resolveEvmSection = async (section: ResolveSection): Promise<void> => {
  if (section.extrinsic.method.method === "create") {
    await processNewContract(section)
  } else {
    await processUnverifiedEvmCall(section);
  } 
}

const resolveSections = async (section: ResolveSection): Promise<void> => {
  switch (section.extrinsic.method.section) {
    case "balances": return processTransfer(section);
    case "currencies": return processTransfer(section);
    case "evm": return resolveEvmSection(section);
  }
}

export const processBlockExtrinsic = (blockId: number, blockEvents: Vec<Event>) => async (extrinsic: Extrinsic, index: number): Promise<void> => {
  const events = blockEvents
    .filter(({phase}) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index));

  const status = extrinsicStatus(events);
  const signedData = extrinsic.isSigned
    ? await getSignedExtrinsicData(extrinsic.toHex())
    : undefined;

  const extrinsicId = await processExtrinsicInsert(extrinsic, blockId, index, status, signedData);
  
  const processEvent = processBlockEvent(blockId, extrinsicId);
  await Promise.all(events.map(processEvent));

  if (extrinsic.isSigned) {
    await resolveSections({extrinsicId, extrinsic, blockId, signedData: signedData!, status, extrinsicEvents: events});
  }
}

