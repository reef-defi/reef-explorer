import {Vec} from "@polkadot/types"
import { nodeProvider } from "../utils/connector";
import {SpRuntimeDispatchError} from "@polkadot/types/lookup"
import { SignedExtrinsicData, InsertExtrinsic, insertExtrinsic, insertTransfer, insertUnverifiedEvmCall, signerExist, insertAccount } from "../queries/block";
import { processExtrinsicEvent } from "./event";
import {BigNumber} from "ethers";
import { Extrinsic, Event } from "./types";
import { processNewContract } from "./contract";


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

interface ProcessTransfer {
  blockId: number;
  extrinsicId: number;
  extrinsic: Extrinsic;
  status: ExtrinsicStatus;
  signedData: SignedExtrinsicData;
}

const getSignedExtrinsicData = async (extrinsicHash: string): Promise<SignedExtrinsicData> => {
  const fee = await nodeProvider.api.rpc.payment.queryInfo(extrinsicHash);
  const feeDetails = await nodeProvider.api.rpc.payment.queryFeeDetails(extrinsicHash);

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


const processExtrinsicInsert = async (extrinsic: Extrinsic, blockId: number, index: number, status: ExtrinsicStatus, sd?: SignedExtrinsicData): Promise<number> => {
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
  
  return insertExtrinsic(extrinsicBody, sd);
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
  const {extrinsic, extrinsicId} = section;
  const account = extrinsic.signer.toString();
  const args: any[] = extrinsic.args.map((arg) => arg.toJSON());

  if (section.extrinsic.method.method === "create") {
    await processNewContract(section)
  } else {
    await insertUnverifiedEvmCall({
      account,
      extrinsicId,
      bytecode: args[0],
      gasLimit: args[2],
      storageLimit: args[3]
    });
  }
}

const resolveSections = async (section: ResolveSection): Promise<void> => {
  switch (section.extrinsic.method.section) {
    case "balances": return processTransfer(section);
    case "currencies": return processTransfer(section);
    case "evm": return resolveEvmSection(section);
  }
}

const resolveAccount = async (address: string, blockId: number): Promise<void> => {
  const exists = await signerExist(address);
  if (exists) { return; }

  const evmAddress = await nodeProvider.api.query.evmAccounts.evmAddresses(address);
  await insertAccount(address, evmAddress.toString(), blockId);
}

export const processBlockExtrinsic = (blockId: number, blockEvents: Vec<Event>) => async (extrinsic: Extrinsic, index: number): Promise<void> => {
  // console.log("Extrinsic id: ", index);
  
  const events = blockEvents
    .filter(({phase}) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index));

  const status = extrinsicStatus(events);
  const signedData = extrinsic.isSigned
    ? await getSignedExtrinsicData(extrinsic.toHex())
    : undefined;
  const extrinsicId = await processExtrinsicInsert(extrinsic, blockId, index, status, signedData);

  if (extrinsic.isSigned && !signedData) {
    throw new Error("Extrinsic signed but no signed data found....");
  }

  if (extrinsic.isSigned) {
    await resolveAccount(extrinsic.signer.toString(), blockId);
    await resolveSections({extrinsicId, extrinsic, blockId, signedData: signedData!, status, extrinsicEvents: events});
  }

  const processEvent = processExtrinsicEvent(blockId, extrinsicId);
  await Promise.all(events.map(processEvent));
}

