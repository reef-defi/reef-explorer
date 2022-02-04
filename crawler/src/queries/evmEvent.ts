import {
  BytecodeLog,
  Contract,
  DecodedEvmError,
  ERC20Token,
  EventBody,
  EVMEventData,
  TokenHolder,
} from '../crawler/types';
import {insert, insertV2, query} from '../utils/connector';
import {GenericEventData} from "@polkadot/types/generic/Event";
import {utils as ethersUtils} from "ethers/lib/ethers";
import {toContractAddress} from "../utils/utils";

const contractToValues = ({
  address,
  extrinsicId,
  bytecode,
  bytecodeContext,
  bytecodeArguments,
  gasLimit,
  storageLimit,
  signer,
  timestamp,
}: Contract): string => {
  const contractAddress = toContractAddress(address);
  return contractAddress ? `('${contractAddress}', ${extrinsicId}, '${signer}', '${bytecode}', '${bytecodeContext}', '${bytecodeArguments}', ${gasLimit}, ${storageLimit}, '${timestamp}')` : '';
};

export const getVerifiedContractDB = async (
    address: string,
): Promise<ERC20Token[]> => {
  const contractAddress = toContractAddress(address);
  return contractAddress
      ? query<ERC20Token>(
          `SELECT address, contract_data, compiled_data, name FROM verified_contract WHERE address='${contractAddress}';`,)
      :[]
};

const parseEvmLogData = async (method: string, genericData: GenericEventData): Promise<undefined|{raw: {address: string, topics?:string[], data?: any}, parsed?: any}> => {
  const eventData = (genericData.toJSON() as any);
  if (method === 'Log') {
    const { topics, data } : BytecodeLog = eventData[0];
    let { address } : BytecodeLog = eventData[0];
    address = toContractAddress(address);
    if(!address) {
      return undefined;
    }
    let evmData = {raw: {address, topics, data}, parsed: {}};
    const contract = await getVerifiedContractDB(address);
    if (contract.length === 0) {
      return evmData;
    }
    const iface = new ethersUtils.Interface(contract[0].compiled_data[contract[0].name]);
    try {
      evmData.parsed = iface.parseLog({ topics, data });
    } catch {
      //
    }
    return evmData;
  } else if (method === 'ExecutedFailed') {
    let decodedMessage;
    try {
      decodedMessage = eventData[2] === '0x' ? '' : ethersUtils.toUtf8String(`0x${eventData[2].substr(138)}`.replace(/0+$/, ''));
    } catch {
      decodedMessage = '';
    }
    const decodedError: DecodedEvmError = { address: eventData[0], message: decodedMessage };
    return {parsed: decodedError, raw: {address:decodedError.address}};
  }
  return undefined;
};

const evmEventDataToInsertValue = async ({
  id,
  data,
  timestamp,
  method,
  section
}: EVMEventData): Promise<string | null> => {
  const parsedEvmData = (section === 'evm' && (method === 'ExecutedFailed' || method === 'Log')) ? await parseEvmLogData(method, data) : undefined;
  if(!parsedEvmData){
    return null;
  }
  const topics = parsedEvmData.raw.topics || []
  const parsedEvmString = parsedEvmData.parsed ? JSON.stringify(parsedEvmData.parsed) : undefined;

  return `(${id}, '${parsedEvmData.raw.address}', '${JSON.stringify(parsedEvmData.raw)}', '${parsedEvmString}', '${method}', '${topics[0]}', '${topics[1]}', '${topics[2]}', '${topics[3]}', '${timestamp}')`;
};

export const insertContracts = async (contracts: Contract[]): Promise<void> => {
  if (contracts.length === 0) {
    return;
  }
  await insert(`
    INSERT INTO contract
      (address, extrinsic_id, signer, bytecode, bytecode_context, bytecode_arguments, gas_limit, storage_limit, timestamp)
    VALUES
      ${contracts.map(contractToValues).filter(v=>!!v).join(',\n')}
    ON CONFLICT (address) DO UPDATE
      SET extrinsic_id = EXCLUDED.extrinsic_id,
        bytecode = EXCLUDED.bytecode,
        gas_limit = EXCLUDED.gas_limit,
        timestamp = EXCLUDED.timestamp,
        storage_limit = EXCLUDED.storage_limit,
        bytecode_context = EXCLUDED.bytecode_context,
        bytecode_arguments = EXCLUDED.bytecode_arguments;
  `);
};

const toEventData = (eventBody: EventBody): EVMEventData => {
  return {
    id: eventBody.id,
    timestamp: eventBody.timestamp,
    data: eventBody.event.event.data,
    section: eventBody.event.event.section,
    method: eventBody.event.event.method
  }
};

export const insertEvmEvents = async (evmEvents: EventBody[]): Promise<void> => {
  if (evmEvents.length < 1) {
    return;
  }
  const insertValuePromises = evmEvents.map(toEventData)
      .map(evmEventDataToInsertValue)
  const evmEventInputValues = (await Promise.all(insertValuePromises)).filter(v=>!!v)

  if(evmEventInputValues.length) {
    console.log("INSSSS=",evmEventInputValues);
    await insert(`
      INSERT INTO evm_event
      (event_id, contract_address, data_raw, data_parsed, method, topic_0, topic_1, topic_2, topic_3, timestamp)
      VALUES
      ${evmEventInputValues.join(',\n')};
    `);
  }
};

export const insertContract = async (contract: Contract): Promise<void> => insertContracts([contract]);

const toTokenHolderInsertValue = ({
  signer,
  balance,
  contractAddress,
  decimals,
  evmAddress,
  type,
  timestamp,
}: TokenHolder): any[] => [signer === '' ? null : signer, evmAddress === '' ? null : evmAddress, type, toContractAddress(contractAddress), balance, decimals, timestamp];

export const insertAccountTokenHolders = async (
  accountTokenHolders: TokenHolder[],
): Promise<void> => {
  await insertV2(`
    INSERT INTO token_holder
      (signer, evm_address, type, token_address, balance, decimals, timestamp)
    VALUES
      %L
    ON CONFLICT (signer, token_address) WHERE evm_address IS NULL DO UPDATE SET
      balance = EXCLUDED.balance,
      timestamp = EXCLUDED.timestamp,
      decimals = EXCLUDED.decimals;
  `, accountTokenHolders.map(toTokenHolderInsertValue));
};

export const insertContractTokenHolders = async (
  contractTokenHolders: TokenHolder[],
): Promise<void> => {
  await insertV2(`
    INSERT INTO token_holder
      (signer, evm_address, type, token_address, balance, decimals, timestamp)
    VALUES
      %L
    ON CONFLICT (evm_address, token_address) WHERE signer IS NULL DO UPDATE SET
      balance = EXCLUDED.balance,
      timestamp = EXCLUDED.timestamp,
      decimals = EXCLUDED.decimals;
  `, contractTokenHolders.map(toTokenHolderInsertValue));
};

export const getERC20Tokens = async (): Promise<ERC20Token[]> => query<ERC20Token>(
  'SELECT address, contract_data, name FROM verified_contract WHERE type=\'ERC20\';',
);
