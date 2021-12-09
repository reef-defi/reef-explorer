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


// export const prepareAccountTokenHeads = (accounts: AccountBody[], erc20Contracts: ERC20Token[]): AccountTokenHead[] => {
//   let accountTokenHeads: AccountTokenHead[] = [];

//   for (const account of accounts) {
//     for (const token of erc20Contracts) {
//       accountTokenHeads.push({
//         accountAddress: account.address,
//         accountEvmAddress: account.evmAddress,
//         contractAddress: token.address,
//       })
//     }
//   }

//   return accountTokenHeads;
// }

// export const extractAccountTokenInformation = async (accountToken: AccountTokenHead): Promise<AccountTokenBalance> => {
//   const token = new EthContract(accountToken.contractAddress, erc20Abi, getProvider());

//   const [balance, decimals] = await Promise.all([
//     token.balanceOf(accountToken.accountEvmAddress),
//     token.decimals()  
//   ]);

//   return {...accountToken, balance, decimals};
// }

export const isEventEvmLog = ({event: {method, section}}: Event): boolean => 
  method === "Log" && section === "evm";


  // const erc20ContractInterface = new utils.Interface(abi["ERC20Contract"]);

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