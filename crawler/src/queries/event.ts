import { AccountBody, EventBody, BytecodeLog, Event } from '../crawler/types';
import { GenericEventData } from '@polkadot/types/generic/Event';
import { insert } from '../utils/connector';
import { utils as ethersUtils } from 'ethers';
import { getContractDB } from '../queries/evmEvent';
import { stringify } from 'querystring';

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
  //TODO we should probably move this to somewhere more appropriate
  const parsedEvmData = (section == 'evm' && (method == 'ExecutedFailed' || method == 'Log')) ? await parseEvmData(method, data) : undefined;
  return `(${id}, ${blockId}, ${extrinsicId}, ${index}, '${section}', '${method}', '${data}', '${JSON.stringify(parsedEvmData) || '{}'}', '${JSON.stringify(phase,)}', '${timestamp}')`
  };

const parseEvmData = async (method: string, data: GenericEventData) => {
  const eventData = (data.toJSON() as any);
  if ( method == 'Log') {
    const {address, topics, data} : BytecodeLog = eventData[0];
    const contract = await getContractDB(address);
    if ( contract.length == 0 ) {
      return undefined
    }
    const iface = new ethersUtils.Interface(contract[0].compiled_data[contract[0].name]);
    return iface.parseLog({ topics, data })
  } else if (method == 'ExecutedFailed') {
    const address = eventData[0];
    const errorBytecode = eventData[-1];
    const contract = await getContractDB(address);
    if ( contract.length == 0) {
      return undefined
    }
    const iface = new ethersUtils.Interface(contract[0].compiled_data[contract[0].name]);
    return iface.parseError(errorBytecode);
  }
  return undefined
}

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
