import { utils } from 'ethers';
import { nodeProvider } from '../utils/connector';
import { resolveSigner } from './extrinsic';
import {
  ExtrinsicBody,
  Event,
  Contract,
  EVMCall,
  AccountHead,
  EvmLog,
  EvmLogWithDecodedEvent,
  BytecodeLog,
  BytecodeLogWithBlockId,
} from './types';
import { getContractDB } from '../queries/evmEvent';
import {
  removeUndefinedItem, resolvePromisesAsChunks,
} from '../utils/utils';

const preprocessBytecode = (bytecode: string) => {
  const start = bytecode.indexOf('6080604052');
  const end = bytecode.indexOf('a265627a7a72315820') !== -1
    ? bytecode.indexOf('a265627a7a72315820')
    : bytecode.indexOf('a264697066735822');
  return {
    context: bytecode.slice(start, end),
    args: bytecode.slice(end),
  };
};

const findContractEvent = (events: Event[]): Event | undefined => events.find(
  ({ event }) => event.section === 'evm' && event.method === 'Created',
);

export const isExtrinsicEVMCreate = ({
  extrinsic: { method },
  events,
}: ExtrinsicBody): boolean => method.section === 'evm'
  && method.method === 'create'
  && !!findContractEvent(events);

export const isExtrinsicEvmClaimAccount = ({
  extrinsic: {
    method: { section, method },
  },
}: ExtrinsicBody): boolean => section === 'evmAccounts' && method === 'claimDefaultAccount';

export const isExtrinsicEVMCall = ({
  extrinsic: { method },
}: ExtrinsicBody): boolean => method.section === 'evm' && method.method === 'call';

export const isEventEvmLog = <T extends {event: Event}>({ event: { event: { method, section } } }: T): boolean => method === 'Log' && section === 'evm';

export const extrinsicToEvmClaimAccount = ({
  events,
  blockId,
  timestamp,
}: ExtrinsicBody): AccountHead[] => {
  const [address] = events[0].event.data;
  return [{
    blockId, address: address.toString(), active: true, timestamp,
  }];
};

export const extrinsicToContract = ({
  extrinsic,
  events,
  id,
  timestamp,
}: ExtrinsicBody): Contract => {
  const { args } = extrinsic;
  const contractEvent = findContractEvent(events)!;
  const address = contractEvent.event.data[0].toString();
  const reserveEvent = events.find((evn) => nodeProvider.getProvider().api.events.balances.Reserved.is(evn.event))!;
  const signer = reserveEvent.event.data[0].toString();
  const bytecode = args[0].toString();
  const gasLimit = args[2].toString();
  const storageLimit = args[3].toString();

  const { context: bytecodeContext, args: bytecodeArguments } = preprocessBytecode(bytecode);
  return {
    signer,
    address,
    bytecode,
    gasLimit,
    timestamp,
    storageLimit,
    bytecodeContext,
    extrinsicId: id,
    bytecodeArguments,
  };
};

export const extrinsicToEVMCall = ({
  extrinsic,
  status,
  id: extrinsicId,
  timestamp,
  blockId,
}: ExtrinsicBody): EVMCall => {
  const account = resolveSigner(extrinsic);
  const args: any[] = extrinsic.args.map((arg) => arg.toJSON());
  const contractAddress: string = args[0];
  const data = JSON.stringify(args.slice(0, args.length - 2));
  const gasLimit = args.length >= 3 ? args[args.length - 2] : 0;
  const storageLimit = args.length >= 3 ? args[args.length - 1] : 0;

  return {
    data,
    status,
    account,
    blockId,
    gasLimit,
    timestamp,
    extrinsicId,
    storageLimit,
    contractAddress,
  };
};

export const extractAccountFromEvmCall = ({ timestamp, blockId, account }: EVMCall): AccountHead[] => [
  {
    blockId, timestamp, address: account, active: true,
  },
];

export const eventToEvmLog = ({ event }: Event): BytecodeLog => (event.data.toJSON() as any)[0];

const extractEvmLog = async (
  event: BytecodeLogWithBlockId,
): Promise<EvmLog | undefined> => {
  const result = await getContractDB(event.address);
  if (result.length === 0) {
    return undefined;
  }

  return {
    ...event,
    name: result[0].name,
    abis: result[0].compiled_data,
    type: result[0].type,
    contractData: result[0].contract_data,
  };
};

const decodeEvmLog = (event: EvmLog): EvmLogWithDecodedEvent => {
  const {
    abis, data, name, topics,
  } = event;
  const abi = new utils.Interface(abis[name]);
  const result = abi.parseLog({ topics, data });
  return { ...event, decodedEvent: result };
};

const extrToEvmLog = ({
  events, blockId, timestamp, id, signedData,
}: ExtrinsicBody) => events
  .map((event) => ({
    event, blockId, timestamp, extrinsicId: id, signedData,
  }));

export const extrinsicToEvmLogs = async (
  extrinsicEvmCalls: ExtrinsicBody[],
): Promise<EvmLogWithDecodedEvent[]> => {
  const baseEvmLogs = extrinsicEvmCalls
    .flatMap(extrToEvmLog)
    .filter(isEventEvmLog)
    .map(({
      event, blockId, timestamp, extrinsicId, signedData,
    }): BytecodeLogWithBlockId => {
      const a = (event.event.data.toJSON() as any)[0];
      return {
        ...a, timestamp, blockId, extrinsicId, signedData,
      };
    })
    .map(extractEvmLog);

  const decodedEvmData = await resolvePromisesAsChunks(baseEvmLogs);

  return decodedEvmData
    .filter(removeUndefinedItem)
    .map(decodeEvmLog);
};

export const isErc20TransferEvent = ({ decodedEvent, type }: EvmLogWithDecodedEvent): boolean => decodedEvent.name === 'Transfer' && type === 'ERC20';

export const isErc721TransferEvent = ({ decodedEvent, type }: EvmLogWithDecodedEvent): boolean => decodedEvent.name === 'Transfer' && type === 'ERC721';

export const isErc1155TransferSingleEvent = ({ decodedEvent, type }: EvmLogWithDecodedEvent): boolean => decodedEvent.name === 'TransferSingle' && type === 'ERC1155';

export const isErc1155TransferBatchEvent = ({ decodedEvent, type }: EvmLogWithDecodedEvent): boolean => decodedEvent.name === 'TransferBatch' && type === 'ERC1155';
