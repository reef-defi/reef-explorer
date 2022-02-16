import { utils as ethersUtils } from 'ethers/lib/ethers';
import { GenericEventData } from '@polkadot/types/generic/Event';
import format from 'pg-format';
import {
  BacktrackingEvmEvent, BytecodeLog, CompleteEvmData, Contract, DecodedEvmError, ERC20Token, EventBody, EVMEventData, VerifiedContract,
} from '../crawler/types';
import { insert, query, queryv2 } from '../utils/connector';
import { toContractAddress } from '../utils/utils';

export const contractToValues = ({
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

export const getContractDB = async (
  address: string,
): Promise<VerifiedContract[]> => {
  const contractAddress = toContractAddress(address);
  return contractAddress
    ? query<VerifiedContract>(
      `SELECT address, contract_data, compiled_data, name, type FROM verified_contract WHERE address='${contractAddress}';`,
    )
    : [];
};

export const insertContracts = async (contracts: Contract[]): Promise<void> => {
  if (contracts.length === 0) {
    return;
  }
  await insert(`
    INSERT INTO contract
      (address, extrinsic_id, signer, bytecode, bytecode_context, bytecode_arguments, gas_limit, storage_limit, timestamp)
    VALUES
      ${contracts.map(contractToValues).filter((v) => !!v).join(',\n')}
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

export const insertContract = async (contract: Contract): Promise<void> => insertContracts([contract]);

export const getERC20Tokens = async (): Promise<ERC20Token[]> => query<ERC20Token>(
  'SELECT address, contract_data, name FROM verified_contract WHERE type=\'ERC20\';',
);

const parseEvmLogData = async (method: string, genericData: GenericEventData): Promise<undefined|CompleteEvmData> => {
  const eventData = (genericData.toJSON() as any);
  if (method === 'Log') {
    const { topics, data } : BytecodeLog = eventData[0];
    let { address } : BytecodeLog = eventData[0];
    address = toContractAddress(address);
    if (!address) {
      return undefined;
    }
    const evmData: CompleteEvmData = {
      raw: { address, topics, data }, parsed: {}, status: 'Success', type: 'Unverified',
    };
    const contract = await getContractDB(address);
    if (contract.length === 0) {
      return evmData;
    }
    const iface = new ethersUtils.Interface(contract[0].compiled_data[contract[0].name]);
    try {
      evmData.parsed = iface.parseLog({ topics, data });
      evmData.type = 'Verified';
    } catch {
      //
    }
    return evmData;
  } if (method === 'ExecutedFailed') {
    let decodedMessage;
    try {
      decodedMessage = eventData[2] === '0x' ? '' : ethersUtils.toUtf8String(`0x${eventData[2].substr(138)}`.replace(/0+$/, ''));
    } catch {
      decodedMessage = '';
    }
    const decodedError: DecodedEvmError = { address: eventData[0], message: decodedMessage };
    return {
      parsed: decodedError, raw: { address: decodedError.address, data: '', topics: [] }, status: 'Error', type: 'Verified',
    };
  }
  return undefined;
};

const toEventData = (eventBody: EventBody): EVMEventData => ({
  id: eventBody.id,
  timestamp: eventBody.timestamp,
  data: eventBody.event.event.data,
  section: eventBody.event.event.section,
  method: eventBody.event.event.method,
  blockId: eventBody.blockId,
  eventIndex: eventBody.index,
  extrinsicIndex: eventBody.extrinsicIndex,
});

const evmEventDataToInsertValue = async ({
  id,
  data,
  method,
  blockId,
  eventIndex,
  extrinsicIndex,
}: EVMEventData): Promise<string | null> => {
  const parsedEvmData = await parseEvmLogData(method, data);
  if (!parsedEvmData) {
    return null;
  }
  const topics = parsedEvmData.raw.topics || [];
  const parsedEvmString = parsedEvmData.parsed ? JSON.stringify(parsedEvmData.parsed) : undefined;

  return `(${id}, '${parsedEvmData.raw.address}', '${JSON.stringify(parsedEvmData.raw)}', '${parsedEvmString}', '${method}', '${topics[0]}', '${topics[1]}', '${topics[2]}', '${topics[3]}', ${blockId}, ${extrinsicIndex}, ${eventIndex}, '${parsedEvmData.status}', '${parsedEvmData.type}')`;
};

export const insertEvmEvents = async (evmEvents: EventBody[]): Promise<void> => {
  if (evmEvents.length < 0) {
    return;
  }
  const insertValuePromises = evmEvents
    .filter(({ event: { event: { section, method } } }) => section === 'evm' && (method === 'ExecutedFailed' || method === 'Log'))
    .map(toEventData)
    .map(evmEventDataToInsertValue);
  const evmEventInputValues = (await Promise.all(insertValuePromises)).filter((v) => !!v);

  if (evmEventInputValues.length) {
    await insert(`
      INSERT INTO evm_event
      (event_id, contract_address, data_raw, data_parsed, method, topic_0, topic_1, topic_2, topic_3, block_id, extrinsic_index, event_index, status, type)
      VALUES
      ${evmEventInputValues.join(',\n')};
    `);
  }
};

export const updateEvmEvents = async (evmEvents: BacktrackingEvmEvent[]): Promise<void> => {
  if (!evmEvents.length) { return; }

  await queryv2(
    format(
      `INSERT INTO evm_event
        (id, event_id, block_id, event_index, extrinsic_index, contract_address, data_raw, method, status, type, data_parsed)
      VALUES
        %L
      ON CONFLICT (id) DO UPDATE SET
        type = EXCLUDED.type,
        data_parsed = EXCLUDED.data_parsed
        `,
      evmEvents.map(({
        id, status, type, method, blockid, parseddata, extrinsicindex, eventindex, eventid, contractaddress, rawdata,
      }) => [id, eventid, blockid, eventindex, extrinsicindex, contractaddress, rawdata, method, status, type, parseddata]),
    ),
  );
};
