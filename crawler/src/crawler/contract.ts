import { insertContract } from "../queries/block";
import {Event, Extrinsic} from "./types";

interface ProcessContract {
  extrinsic: Extrinsic;
  extrinsicId: number;
  extrinsicEvents: Event[]
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

export const processNewContract = async ({extrinsicEvents, extrinsic, extrinsicId}: ProcessContract): Promise<void> => {
  const {args} = extrinsic;
  const event = extrinsicEvents.find(
    ({event}) => event.section === 'evm' && event.method === 'Created'
  );
  if (!event) {
    throw new Error("Event does not exist");
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
}