import { insertContract, insertEvmCall } from "../queries/evmEvent";
import { resolveSigner } from "./extrinsic";
import {OldContract, ExtrinsicBody, Event, Contract, ResolveSection, EVMCall} from "./types";



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

export const processNewContract = async ({extrinsicEvents, extrinsic, extrinsicId, blockId, status}: OldContract): Promise<void> => {
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

const findContractEvent = (events: Event[]): Event|undefined => events.find(
  ({event}) => event.section === 'evm' && event.method === 'Created'
);

export const isExtrinsicEVMCreate = ({extrinsic: {method}, events}: ExtrinsicBody): boolean => 
  method.section === "evm" &&
  method.method === "create" &&
  !!findContractEvent(events);

export const isExtrinsicEVMCall = ({extrinsic: {method}}: ExtrinsicBody): boolean => {


  return method.section === "evm" && method.method === "call";
}

export const extrinsicToContract = ({extrinsic, events, id}: ExtrinsicBody): Contract => {
  const {args} = extrinsic;
  const event = events.find(
    ({event}) => event.section === 'evm' && event.method === 'Created'
  )!;
  const address = event.event.data[0].toString();

  const bytecode = args[0].toString();
  const gasLimit = args[2].toString();
  const storageLimit = args[3].toString();

  const {context: bytecodeContext, args: bytecodeArguments} = preprocessBytecode(bytecode)
  
  return {
    address,
    bytecode,
    gasLimit,
    storageLimit,
    bytecodeContext,
    extrinsicId: id,
    bytecodeArguments,
  }
}

export const extrinsicToEVMCall = ({extrinsic, status, id: extrinsicId}: ExtrinsicBody): EVMCall => {
  const account = resolveSigner(extrinsic);
  const args: any[] = extrinsic.args.map((arg) => arg.toJSON());
  const contractAddress: string = args[0];
  const data = JSON.stringify(args.slice(0, args.length-2));
  const gasLimit = args.length >= 3 ? args[args.length-2] : 0;
  const storageLimit = args.length >= 3 ? args[args.length-1] : 0;

  return {
    data,
    status,
    account,
    gasLimit,
    extrinsicId,
    storageLimit,
    contractAddress,
  }
}


export const processUnverifiedEvmCall = async (section: ResolveSection): Promise<void> => {
  const {extrinsic, extrinsicId, status} = section;
  const account = resolveSigner(extrinsic);
  const args: any[] = extrinsic.args.map((arg) => arg.toJSON());
  const contractAddress: string = args[0];
  const data = JSON.stringify(args.slice(0, args.length-2));
  const gasLimit = args.length >= 3 ? args[args.length-2] : 0;
  const storageLimit = args.length >= 3 ? args[args.length-1] : 0;
  await insertEvmCall({
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
