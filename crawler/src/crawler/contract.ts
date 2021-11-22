import { insertContract } from "../queries/block";
import {Event, Extrinsic, ExtrinsicStatus} from "./types";

interface ProcessContract {
  blockId: number;
  extrinsic: Extrinsic;
  extrinsicId: number;
  extrinsicEvents: Event[];
  status: ExtrinsicStatus;
}


const preprocessBytecode = (bytecode: string) => {
  const start = bytecode.indexOf('6080604052');
  const end = bytecode.indexOf('a265627a7a72315820') !== -1
    ? bytecode.indexOf('a265627a7a72315820')
    : bytecode.indexOf('a264697066735822')
  return {
    context: bytecode.slice(start, end),
    args: bytecode.slice(end)
  }
}

export const processNewContract = async ({extrinsicEvents, extrinsic, extrinsicId, blockId, status}: ProcessContract): Promise<void> => {
  const {args} = extrinsic;
  const event = extrinsicEvents.find(
    ({event}) => event.section === 'evm' && event.method === 'Created'
  );
  if (!event) {
    const message = status.type === 'error'
      ? `with message: ${status.message}`
      : '';
    console.log(`Block: ${blockId} -> Contract deploy failed ${message}`);
    return;
  }
  const address = event.event.data[0].toString();

  const bytecode = args[0].toString();
  const gasLimit = args[2].toString();
  const storageLimit = args[3].toString();

  const {context, args: bytecodeArguments} = preprocessBytecode(bytecode)

  await insertContract({
    address,
    bytecode,
    gasLimit,
    extrinsicId,
    storageLimit,
    bytecodeArguments,
    bytecodeContext: context,
  });
  console.log(`Block: ${blockId} -> New contract with address: ${address} added`);
}