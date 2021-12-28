import { insertContract, insertEvmCall } from "../queries/evmEvent";
import { getProvider, nodeQuery } from "../utils/connector";
import { resolveSigner } from "./extrinsic";
import {Contract as EthContract, utils} from "ethers";
import {OldContract, ExtrinsicBody, Event, Contract, ResolveSection, EVMCall, AccountBody, AccountTokenHead, AccountTokenBalance, ERC20Token} from "./types";
import erc20Abi from "../assets/erc20Abi";



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
  const {args, signer} = extrinsic;
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
    signer: signer.toString()
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


export const isEventEvmLog = ({event: {method, section}}: Event): boolean => 
  method === "Log" && section === "evm";


interface BytecodeLog {
  address: string;
  data: string;
  topics: string[];
}

export const eventToEvmLog = ({event}: Event): BytecodeLog => 
  (event.data.toJSON() as any)[0];



export const checkIfEvmContractCallIsVerifiedERC20Token = async (log: BytecodeLog): Promise<void> => {

}
// const decodeErc20Event = ({event}: Event): utils.LogDescription => {
//   const result: BytecodeLog = (event.data.toJSON() as any)[0];
//   // if (result.address !== "0x0000000000000000000000000000000001000000" && result.address !== "0xF7108a2737687f3780D7846852DEd6A75fADaC01") {
//   //   return;
//   // }
//   return erc20ContractInterface.parseLog(result)
// } 