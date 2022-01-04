import { nodeQuery } from "../utils/connector";
import { resolveSigner } from "./extrinsic";
import {
  ExtrinsicBody,
  Event,
  Contract,
  EVMCall,
  AccountHead,
  ABI,
  EvmLog,
  AccountTokenBalance,
  EvmLogWithDecodedEvent,
  TokenBalanceHead,
  BytecodeLog,
  BytecodeLogWithBlockId,
} from "./types";
import { Contract as EthContract, utils } from "ethers";
import { findErc20TokenDB } from "../queries/evmEvent";
import {
  compress,
  dropDuplicatesMultiKey,
  removeUndefinedItem,
} from "../utils/utils";

const preprocessBytecode = (bytecode: string) => {
  const start = bytecode.indexOf("6080604052");
  const end =
    bytecode.indexOf("a265627a7a72315820") !== -1
      ? bytecode.indexOf("a265627a7a72315820")
      : bytecode.indexOf("a264697066735822");
  return {
    context: bytecode.slice(start, end),
    args: bytecode.slice(end),
  };
};

const findContractEvent = (events: Event[]): Event | undefined =>
  events.find(
    ({ event }) => event.section === "evm" && event.method === "Created"
  );

export const isExtrinsicEVMCreate = ({
  extrinsic: { method },
  events,
}: ExtrinsicBody): boolean =>
  method.section === "evm" &&
  method.method === "create" &&
  !!findContractEvent(events);

export const isExtrinsicEvmClaimAccount = ({
  extrinsic: {
    method: { section, method },
  },
}: ExtrinsicBody): boolean =>
  section === "evmAccounts" && method === "claimDefaultAccount";

export const isExtrinsicEVMCall = ({
  extrinsic: { method },
}: ExtrinsicBody): boolean => {
  return method.section === "evm" && method.method === "call";
};

export const extrinsicToEvmClaimAccount = ({
  events,
  blockId,
}: ExtrinsicBody): AccountHead[] => {
  const [address] = events[0].event.data;
  return [{ blockId, address: address.toString(), active: true }];
};

export const extrinsicToContract = ({
  extrinsic,
  events,
  id,
}: ExtrinsicBody): Contract => {
  const { args, signer } = extrinsic;
  const event = events.find(
    ({ event }) => event.section === "evm" && event.method === "Created"
  )!;
  const address = event.event.data[0].toString();

  const bytecode = args[0].toString();
  const gasLimit = args[2].toString();
  const storageLimit = args[3].toString();

  const { context: bytecodeContext, args: bytecodeArguments } =
    preprocessBytecode(bytecode);

  return {
    address,
    bytecode,
    gasLimit,
    storageLimit,
    bytecodeContext,
    extrinsicId: id,
    bytecodeArguments,
    signer: signer.toString(),
  };
};

export const extrinsicToEVMCall = ({
  extrinsic,
  status,
  id: extrinsicId,
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
    gasLimit,
    extrinsicId,
    storageLimit,
    contractAddress,
  };
};

export const isEventEvmLog = ({ event: { method, section } }: Event): boolean =>
  method === "Log" && section === "evm";

export const eventToEvmLog = ({ event,  }: Event): BytecodeLog =>
  (event.data.toJSON() as any)[0];

const getContractBalance = (
  address: string,
  contractAddress: string,
  abi: ABI
) =>
  nodeQuery(async (provider): Promise<string> => {
    const contract = new EthContract(contractAddress, abi, provider);
    return await contract.balanceOf(address);
  });

const extractEvmLog = async (
  event: BytecodeLogWithBlockId
): Promise<EvmLog | undefined> => {
  const result = await findErc20TokenDB(event.address);
  if (result.length === 0) {
    return undefined;
  }

  return {
    ...event,
    name: result[0].name,
    abis: result[0].compiled_data,
    decimals: result[0].contract_data.decimals,
  };
};

const decodeEvmLog = (event: EvmLog): EvmLogWithDecodedEvent => {
  const { abis, data, name, topics } = event;
  const abi = new utils.Interface(abis[name]);
  const result = abi.parseLog({ topics, data });
  return { ...event, decodedEvent: result };
};

const erc20TransferEvent = ({
  address,
  decimals,
  decodedEvent,
  abis,
  name,
  blockId
}: EvmLogWithDecodedEvent): TokenBalanceHead[] => [
  {
    blockId,
    decimals,
    abi: abis[name],
    contractAddress: address,
    signerAddress: decodedEvent.args[0],
  },
  {
    blockId,
    decimals,
    abi: abis[name],
    contractAddress: address,
    signerAddress: decodedEvent.args[1],
  },
];

export const extractTokenBalance = async ({
  decimals,
  abi,
  contractAddress,
  signerAddress,
  blockId
}: TokenBalanceHead): Promise<AccountTokenBalance | undefined> => {
  const [balance, signerAddr] = await Promise.all([
    getContractBalance(signerAddress, contractAddress, abi),
    nodeQuery((provider) =>
      provider.api.query.evmAccounts.accounts(signerAddress)
    ),
  ]);

  const addr = signerAddr.toJSON() as string;

  if (addr === null) {
    return undefined;
  }

  return {
    balance,
    decimals,
    contractAddress,
    accountEvmAddress: signerAddress,
    signer: addr,
    blockId
  };
};

export const extractEvmLogHeaders = (
  extrinsicEvmCalls: ExtrinsicBody[]
): Promise<EvmLog | undefined>[] =>
  compress(extrinsicEvmCalls.map(({ events, blockId }) => events.map((event) => ({event, blockId}))))
    .filter(
      ({ event: {event: { method, section } } }) => method === "Log" && section === "evm"
    )
    .map(({ event, blockId }): BytecodeLogWithBlockId => {
      const a = (event.event.data.toJSON() as any)[0]
      return {...a, blockId};
    })
    .map(extractEvmLog);

export const extractTokenTransferEvents = (evmLogs: (EvmLog | undefined)[]) =>
  dropDuplicatesMultiKey(
    compress(
      evmLogs
        .filter(removeUndefinedItem)
        .map(decodeEvmLog)
        .filter(({ decodedEvent }) => decodedEvent.name === "Transfer")
        .map(erc20TransferEvent)
    ),
    ["signerAddress", "contractAddress"]
  );

export const tokenHolderToAccount = ({signer, blockId}: AccountTokenBalance): AccountHead[] => [
  {active: true, address: signer, blockId}
];