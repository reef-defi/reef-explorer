import { utils } from 'ethers';
import ReefswapPair from '../assets/ReefswapPairAbi';
import { RawEventData } from '../crawler/types';
import { queryv2 } from '../utils/connector';
import logger from '../utils/logger';
import BurnEvent from './events/BurnEvent';
import EmptyEvent from './events/EmptyEvent';
import FactoryEvent from './events/FactoryEvent';
import MintEvent from './events/MintEvent';
import { PairEvent } from './events/PoolEvent';
import PoolEventBase from './events/PoolEventBase';
import SwapEvent from './events/SwapEvent';
import SyncEvent from './events/SyncEvent';
import TransferEvent from './events/TransferEvent';

interface ID {
  id: string;
}

interface PartialEvmEvent {
  id: string;
  block_id: string;
  timestamp: string;
  rawdata: RawEventData;
  contractaddress: string;
}

const selectPoolEvent = (pairEvent: PairEvent, data: utils.LogDescription): PoolEventBase<utils.LogDescription> => {
  switch (data.name) {
    case 'Mint': return new MintEvent(pairEvent);
    case 'Burn': return new BurnEvent(pairEvent);
    case 'Swap': return new SwapEvent(pairEvent);
    case 'Sync': return new SyncEvent(pairEvent);
    case 'Transfer': return new TransferEvent(pairEvent);
    default: return new EmptyEvent(pairEvent.eventId);
  }
};

const processPairEvent = async (pairEvent: PairEvent): Promise<void> => {
  logger.info('Reefswap Pair event detected!');
  const contractInterface = new utils.Interface(ReefswapPair);
  const data = contractInterface.parseLog(pairEvent.rawData);

  const event = selectPoolEvent(pairEvent, data);
  await event.combine(data);
};

const findEvmEvent = async (eventId: string): Promise<PartialEvmEvent> => {
  const evmEvents = await queryv2<PartialEvmEvent>(
    `SELECT 
      ee.id, ee.data_raw as rawdata, ee.contract_address as contractaddress, b.timestamp 
    FROM evm_event as ee
    JOIN block as b
      ON ee.block_id = b.id
    WHERE ee.id = $1;`,
    [eventId],
  );

  if (evmEvents.length === 0) {
    throw new Error('Evm event does not exist');
  }

  return evmEvents[0];
};

const findPoolID = async (address: string): Promise<string|undefined> => {
  const ids = await queryv2<ID>('SELECT id FROM pool WHERE address = $1', [address]);
  return ids.length > 0 ? ids[0].id : undefined;
};

const getEvmEvents = async (blockId: string): Promise<PartialEvmEvent[]> => queryv2<PartialEvmEvent>(
  `SELECT
    ee.block_id, ee.id, ee.data_raw as rawdata, ee.contract_address as contractaddress, b.timestamp
  FROM evm_event as ee
  JOIN block as b
    ON ee.block_id = b.id
  WHERE ee.block_id = $1;`,
  [blockId],
);

export const processPoolBlock = async (blockId: string): Promise<void> => {
  const evmEvents = await getEvmEvents(blockId);

  for (const event of evmEvents) {
    // Check if event is Reefswap factory create pool event. If so add new pool in DB
    if (FactoryEvent.isFactoryCreateEvent(event.rawdata.address)) {
      const factoryEvent = new FactoryEvent(event.id);
      await factoryEvent.combine(event.rawdata);
      return;
    }

    const poolId = await findPoolID(event.contractaddress);
    if (poolId) {
      await processPairEvent({
        poolId,
        eventId: event.id,
        rawData: event.rawdata,
        blockId: event.block_id,
        timestamp: event.timestamp,
        address: event.contractaddress,
      });
    }
  }
};

export default async (eventId: string): Promise<void> => {
  // logger.info(`Processing event: ${eventId}`);
  const event = await findEvmEvent(eventId);

  // Check if event is Reefswap factory create pool event. If so add new pool in DB
  if (FactoryEvent.isFactoryCreateEvent(event.rawdata.address)) {
    const factoryEvent = new FactoryEvent(eventId);
    await factoryEvent.combine(event.rawdata);
    return;
  }

  // Check if current event address is in pools table
  // If so process pool event accordingly
  const poolId = await findPoolID(event.contractaddress);
  if (poolId) {
    await processPairEvent({
      eventId,
      poolId,
      rawData: event.rawdata,
      blockId: event.block_id,
      timestamp: event.timestamp,
      address: event.contractaddress,
    });
  }
};
