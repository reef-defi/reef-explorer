import {  nodeQuery, setResolvingBlocksTillId } from "../utils/connector";
import { insertMultipleBlocks, updateBlockFinalized } from "../queries/block";
import { extrinsicBodyToTransfer, extrinsicStatus, isExtrinsicTransfer, resolveSigner } from "./extrinsic";
import type { BlockHash as BH } from '@polkadot/types/interfaces/chain';
import type { SignedBlock } from '@polkadot/types/interfaces/runtime';
import type { HeaderExtended } from '@polkadot/api-derive/type/types';
import {Vec} from "@polkadot/types"
import {ABI, ABIS, AccountTokenBalance, Event, EventHead, ExtrinsicBody, ExtrinsicHead, SignedExtrinsicData} from "./types";
import { InsertExtrinsicBody, insertExtrinsics, insertTransfers, nextFreeIds } from "../queries/extrinsic";
import { insertAccounts, insertEvents, InsertEventValue } from "../queries/event";
import { accountHeadToBody, accountNewOrKilled, extractAccounts } from "./event";
import { compress, dropDuplicates, dropDuplicatesMultiKey, range } from "../utils/utils";
import { extrinsicToContract, extrinsicToEVMCall, isExtrinsicEVMCall, isExtrinsicEVMCreate } from "./evmEvent";
import { findErc20TokenDB, insertAccountTokenBalances, insertContracts, insertEvmCalls } from "../queries/evmEvent";
import {utils, Contract} from "ethers";
// export const processBlock = async (id: number): Promise<void> => {
//   // console.log(id)
//   const hash = await nodeProvider.api.rpc.chain.getBlockHash(id);
  
//   const [signedBlock, extendedHeader, events, [, freeExtrinsicId]] = await Promise.all([
//     nodeProvider.api.rpc.chain.getBlock(hash),
//     nodeProvider.api.derive.chain.getHeader(hash),
//     nodeProvider.api.query.system.events.at(hash),
//     nextFreeIds()
//   ]);

//   const {block, } = signedBlock;
//   const {header, extrinsics} = block;
  
//   const body = {
//     id,
//     hash: hash.toString(),
//     author: extendedHeader?.author?.toString() || "",
//     parentHash: header.parentHash.toString(),
//     stateRoot: header.stateRoot.toString(),
//     extrinsicRoot: header.extrinsicsRoot.toString(),
//   };
//   await insertInitialBlock(body);

//   const processExtrinsic = processBlockExtrinsic(id, events, freeExtrinsicId);
//   await Promise.all(extrinsics.map(processExtrinsic));

//   await blockFinalized(id);
// };


interface BlockHash {
  id: number;
  hash: BH;
}

interface BlockBody extends BlockHash {
  signedBlock: SignedBlock;
  extendedHeader?: HeaderExtended;
  events: Vec<Event>;
}

const blockHash = async (id: number): Promise<BlockHash> => {
  const hash = await nodeQuery((provider) => provider.api.rpc.chain.getBlockHash(id));
  return {id, hash}
};

const blockBody = async ({id, hash}: BlockHash): Promise<BlockBody> => {
  const [signedBlock, extendedHeader, events] = await Promise.all([
    nodeQuery((provider) => provider.api.rpc.chain.getBlock(hash)),
    nodeQuery((provider) => provider.api.derive.chain.getHeader(hash)),
    nodeQuery((provider) => provider.api.query.system.events.at(hash)),
  ]);
  return {id, hash, signedBlock, extendedHeader, events}
}

const blockBodyToInsert = ({id, hash, extendedHeader, signedBlock}: BlockBody) => ({id, 
  finalized: true,
  hash: hash.toString(),
  author: extendedHeader?.author?.toString() || "",
  parentHash: signedBlock.block.header.parentHash.toString(),
  stateRoot: signedBlock.block.header.stateRoot.toString(),
  extrinsicRoot: signedBlock.block.header.extrinsicsRoot.toString(),
})

const isExtrinsicEvent = (extrinsicIndex: number) => ({phase}: Event): boolean => 
  phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(extrinsicIndex)

const blockToExtrinsicsHeader = ({id, signedBlock, events}: BlockBody): ExtrinsicHead[] => 
  signedBlock.block.extrinsics
    .map((extrinsic, index) => ({
      extrinsic,
      blockId: id,
      events: events.filter(isExtrinsicEvent(index)),
      status: extrinsicStatus(events)
    }));

const getSignedExtrinsicData = async (extrinsicHash: string): Promise<SignedExtrinsicData> => {
  const [fee, feeDetails] = await Promise.all([
    // nodeProvider.api.rpc.payment.queryInfo(extrinsicHash),
    // nodeProvider.api.rpc.payment.queryFeeDetails(extrinsicHash),
    nodeQuery((provider) => provider.api.rpc.payment.queryInfo(extrinsicHash)),
    nodeQuery((provider) => provider.api.rpc.payment.queryFeeDetails(extrinsicHash)),
  ]);
  
  return {
    fee: fee.toJSON(),
    feeDetails: feeDetails.toJSON(),
  };
}

const extrinsicBody = (nextFreeId: number) => async (extrinsicHead: ExtrinsicHead, index: number): Promise<ExtrinsicBody> => ({...extrinsicHead,
  id: nextFreeId + index,
  signedData: extrinsicHead.extrinsic.isSigned ? await getSignedExtrinsicData(extrinsicHead.extrinsic.toHex()) : undefined
})

const extrinsicToInsert = ({id, extrinsic, signedData, blockId, events}: ExtrinsicBody, index: number): InsertExtrinsicBody => {
  const status = extrinsicStatus(events);
  const {hash, method, args, meta} = extrinsic;
  return {
    id,
    index,
    blockId,
    signedData,
    status: status.type,
    hash: hash.toString(),
    method: method.method,
    section: method.section,
    signed: resolveSigner(extrinsic),
    args: JSON.stringify(args),
    docs: meta.docs.toLocaleString(),
    error_message: status.type === 'error' ? status.message : "",
  }
};

const extrinsicToEventHeader = ({id, blockId, events}: ExtrinsicBody): EventHead[] => events
  .map((event) => ({
    blockId,
    extrinsicId: id,
    event
  }));

const eventToInsert = (nextFreeId: number) => ({event, extrinsicId, blockId}: EventHead, index: number): InsertEventValue => ({
  extrinsicId, blockId, index,
  id: nextFreeId + index,
  data: JSON.stringify(event.event.data.toJSON()),
  method: event.event.method,
  section: event.event.section
});


interface Performance {
  transactions: number;
  dbTime: number;
  nodeTime: number;
  processingTime: number;
}

const defaultPerofmance = (): Performance => ({
  nodeTime: 0,
  dbTime: 0,
  processingTime: 0,
  transactions: 0,
});

export const processBlocks = async (fromId: number, toId: number): Promise<Performance> => {
  // console.log(`Processing blocks from ${fromId} to ${toId}`);
  const blockIds = range(fromId, toId);
  let per = defaultPerofmance();
  setResolvingBlocksTillId(toId-1);
  per.transactions = blockIds.length * 2;
  
  let st = Date.now();
  let hashes = await Promise.all(blockIds.map(blockHash));
  let blocks = await Promise.all(hashes.map(blockBody));
  per.nodeTime += Date.now() - st;
  
  // Free memory
  hashes = []; 
  // Insert blocks
  st = Date.now();
  await insertMultipleBlocks(blocks.map(blockBodyToInsert));
  per.dbTime += Date.now() - st;
  per.transactions += 1;
  
  // Extrinsics
  st = Date.now();
  let extrinsicHeaders = compress(blocks.map(blockToExtrinsicsHeader));
  per.transactions += 1 + extrinsicHeaders.filter((e) => e.extrinsic.isSigned).length;
  per.processingTime += Date.now() - st;
  const [eid, feid] = await nextFreeIds();
  
  st = Date.now();
  let extrinsics = await Promise.all(extrinsicHeaders.map(extrinsicBody(feid)));
  per.nodeTime += Date.now() - st + 0;
  
  // Free memory
  blocks = [];
  extrinsicHeaders = [];
  
  st = Date.now();
  await insertExtrinsics(extrinsics.map(extrinsicToInsert));
  per.dbTime += Date.now() - st;
  per.transactions += 1;
  
  // Events
  st = Date.now();
  let events = compress(extrinsics.map(extrinsicToEventHeader));
  per.processingTime += Date.now() - st;
  
  st = Date.now();
  await insertEvents(events.map(eventToInsert(eid)));
  per.transactions += 1;
  per.dbTime += Date.now() - st;
  
  // Accounts
  st = Date.now();
  let insertOrDeleteAccount = dropDuplicates(compress(events.map(accountNewOrKilled)), 'address')
  per.processingTime += Date.now() - st;
  
  per.transactions += insertOrDeleteAccount.length;
  st = Date.now();
  let accounts = await Promise.all(insertOrDeleteAccount.map(accountHeadToBody));
  per.nodeTime += Date.now() - st;
  st = Date.now();
  await insertAccounts(accounts);
  per.dbTime += Date.now() - st;
  
  // Free memory
  events = [];
  accounts = [];
  insertOrDeleteAccount = [];
  // Transfers
  st = Date.now();
  let transfers = extrinsics
    .filter(isExtrinsicTransfer)
    .map(extrinsicBodyToTransfer);
  per.processingTime += Date.now() - st;
  
  st = Date.now();
  await insertTransfers(transfers);
  per.dbTime += Date.now() - st;
  per.transactions += 1;
  transfers = [];
  
  // Contracts
  st = Date.now();
  let contracts = extrinsics
    .filter(isExtrinsicEVMCreate)
    .map(extrinsicToContract)
  per.processingTime += Date.now() - st;
  st = Date.now();
  await insertContracts(contracts)
  per.dbTime += Date.now() - st;
  per.transactions += 1;
  contracts = [];
  
  // EVM Calls
  st = Date.now();
  const extrinsicEvmCalls = extrinsics
    .filter(isExtrinsicEVMCall)
  let evmCalls = extrinsicEvmCalls
    .map(extrinsicToEVMCall)
  per.processingTime += Date.now() - st;
  st = Date.now();
  await insertEvmCalls(evmCalls);
  per.dbTime += Date.now() - st;
  per.transactions += 1;
  
  // Token balance
  let evmLogs = await Promise.all(
    compress(extrinsicEvmCalls.map(({events}) => events))
    .filter(({event: {method, section}}) => (method === "Log" && section === "evm"))
    .map(({event}): BytecodeLog => (event.data.toJSON() as any)[0])
    .map(async (event): Promise<EvmLog|null> => {
      const result = await findErc20TokenDB(event.address);
      if (result.length === 0) { return null; }
      
      return {...event,
        name: result[0].name,
        abis: result[0].compiled_data,
        decimals: result[0].contract_data.decimals,
      }
    })
  );
  
  const tokenTransferEvents = dropDuplicatesMultiKey(compress(evmLogs
    .filter((e) => e !== null)
    .map((event): EvmLogWithDecodedEvent => {
        const {abis, data, name, topics} = event!;
        const abi = new utils.Interface(abis[name]);
        const result = abi.parseLog({topics, data});
        return {...event!, 
          decodedEvent: result
        };
      })
      .filter(({decodedEvent}) => decodedEvent.name === "Transfer")
      .map(({address, decimals, decodedEvent, abis, name}): TokenBalanceHead[] => [
          {contractAddress: address, signerAddress: decodedEvent.args[0], decimals, abi: abis[name]},
          {contractAddress: address, signerAddress: decodedEvent.args[1], decimals, abi: abis[name]},
    ])), ["signerAddress", "contractAddress"]);
  
  const tokenBalances = await Promise.all(tokenTransferEvents
    .map(async ({decimals, abi, contractAddress, signerAddress}): Promise<AccountTokenBalance> => {
      const balance = await getContractBalance(signerAddress, contractAddress, abi);
      return {
        decimals,
        balance,
        accountAddress: signerAddress,
        contractAddress
      }
    })
  );
  await insertAccountTokenBalances(tokenBalances);
  
  evmCalls = [];
  
  st = Date.now();
  await updateBlockFinalized(fromId, toId);
  per.dbTime += Date.now() - st;
  per.transactions += 1;
  return per;
}
    
interface BytecodeLog {
  address: string;
  data: string;
  topics: string[];
}

interface EvmLog extends BytecodeLog {
  name: string;
  abis:ABIS
  decimals: number;
}

interface EvmLogWithDecodedEvent extends EvmLog {
  decodedEvent: utils.LogDescription
}

interface TokenBalanceHead {
  contractAddress: string;
  signerAddress: string;
  decimals: number;
  abi: ABI;
}

const getContractBalance = (address: string, contractAddress: string, abi: ABI) => 
  nodeQuery(async (provider): Promise<string> => {
    const contract = new Contract(contractAddress, abi, provider);
    return await contract.balanceOf(address);
  });