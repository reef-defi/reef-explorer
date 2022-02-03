import { GenericEventData } from '@polkadot/types/generic/Event';
import { utils as ethersUtils } from 'ethers';
import {
  AccountBody, EventBody, BytecodeLog,
  DecodedEvmError,
} from '../crawler/types';
import { insert } from '../utils/connector';
import {getContractDB, insertEvmCall, insertEvmEvent} from './evmEvent';

const evmData = async (method: string, genericData: GenericEventData): Promise<undefined|{raw: {address: string, topics?:string[], data?: any}, parsed?: any}> => {
  const eventData = (genericData.toJSON() as any);
  if (method === 'Log') {
    const { address, topics, data } : BytecodeLog = eventData[0];
    let evmData = {raw: {address, topics, data}, parsed: {}};
    const contract = await getContractDB(address);
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

const toEventValue = async ({
  id,
  blockId,
  extrinsicId,
  index,
  event: {
    event: { method, section, data },
    phase,
  },
  timestamp,
}: EventBody): Promise<string> => {
  // TODO we should probably move this to somewhere more appropriate
  const parsedEvmData = (section === 'evm' && (method === 'ExecutedFailed' || method === 'Log')) ? await evmData(method, data) : undefined;
  if(parsedEvmData){
    ...
    insertEvmEvent({data: parsedEvmData, eventId: id, success: method === 'Log', topics: parsedEvmData.raw.topics || [], contractAddress: parsedEvmData.raw.address, timestamp})
  }
  return `(${id}, ${blockId}, ${extrinsicId}, ${index}, '${section}', '${method}', '${data}', '${JSON.stringify(parsedEvmData) || '{}'}', '${JSON.stringify(phase)}', '${timestamp}')`;
};

export const insertEvents = async (events: EventBody[]): Promise<void> => {
  if (events.length > 0) {
    await insert(`
INSERT INTO event
  (id, block_id, extrinsic_id, index, section, method, data, parsed_data, phase, timestamp)
VALUES
  ${(await Promise.all(events.map(toEventValue))).join(',\n')};
`);
  }
};
export const insertEvent = async (event: EventBody) => insertEvents([event]);

const accountToInsertValue = ({
  address,
  evmAddress,
  blockId,
  active,
  freeBalance,
  availableBalance,
  lockedBalance,
  reservedBalance,
  votingBalance,
  vestedBalance,
  identity,
  nonce,
  evmNonce,
  timestamp,
}: AccountBody): string => `
  ('${address}', '${evmAddress}', ${blockId}, ${active}, ${freeBalance}, ${lockedBalance}, ${availableBalance}, ${reservedBalance}, ${votingBalance}, ${vestedBalance}, '${identity}', ${nonce}, ${evmNonce}, '${timestamp}')`;

export const insertAccounts = async (
  accounts: AccountBody[],
): Promise<void> => {
  if (accounts.length > 0) {
    await insert(`
INSERT INTO account
  (address, evm_address, block_id, active, free_balance, locked_balance, available_balance, reserved_balance, voting_balance, vested_balance, identity, nonce, evm_nonce, timestamp)
VALUES
  ${accounts.map(accountToInsertValue).join(',')}
ON CONFLICT (address) DO UPDATE SET
  active = EXCLUDED.active,
  block_id = EXCLUDED.block_id,
  evm_address = EXCLUDED.evm_address,
  free_balance = EXCLUDED.free_balance,
  locked_balance = EXCLUDED.locked_balance,
  vested_balance = EXCLUDED.vested_balance,
  voting_balance = EXCLUDED.voting_balance,
  reserved_balance = EXCLUDED.reserved_balance,
  available_balance = EXCLUDED.available_balance,
  timestamp = EXCLUDED.timestamp,
  nonce = EXCLUDED.nonce,
  evm_nonce = EXCLUDED.evm_nonce,
  identity = EXCLUDED.identity;
`);
  }
};
