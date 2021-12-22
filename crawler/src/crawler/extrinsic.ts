import {SpRuntimeDispatchError} from "@polkadot/types/lookup"
import {BigNumber} from "ethers";
import { Extrinsic, Event, ExtrinsicStatus, ExtrinsicBody, Transfer } from "./types";
import { getProvider} from "../utils/connector";


export const resolveSigner = (extrinsic: Extrinsic): string => extrinsic.signer?.toString() || 'deleted';

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

export const isExtrinsicTransfer = ({extrinsic, status}: ExtrinsicBody): boolean => 
     (extrinsic.method.section === "balances" 
  || extrinsic.method.section === "currencies") && status.type === "success";

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