import { utils } from 'ethers';
import ReefswapPair from '../assets/ReefswapPair';
import { RawEventData } from '../crawler/types';
import { queryv2 } from '../utils/connector';
import logger from '../utils/logger';
import BurnEvent from './events/BurnEvent';
import FactoryEvent from './events/FactoryEvent';
import MintEvent from './events/MintEvent';
import PoolEvent from './events/PoolEvent';
import SwapEvent from './events/SwapEvent';
import SyncEvent from './events/SyncEvent';
import TransferEvent from './events/TransferEvent';

interface DefaultPairEvent {
  poolId: string;
  address: string;
  eventId: string;
  timestamp: string;
}

interface InitialPairEvent extends DefaultPairEvent {
  rawData: RawEventData;
}

interface ID {
  id: string;
}

interface PartialEvmEvent {
  id: string;
  timestamp: string;
  rawdata: RawEventData;
  contractaddress: string;
}


const selectPoolEvent = (pairEvent: InitialPairEvent, data: utils.LogDescription): PoolEvent => {
  switch (data.name) {
    case 'Mint': return new MintEvent(pairEvent.poolId, pairEvent.eventId, pairEvent.timestamp);
    case 'Burn': return new BurnEvent(pairEvent.poolId, pairEvent.eventId, pairEvent.timestamp);
    case 'Swap': return new SwapEvent(pairEvent.poolId, pairEvent.eventId, pairEvent.timestamp);
    case 'Sync': return new SyncEvent(pairEvent.poolId, pairEvent.eventId, pairEvent.timestamp);
    case 'Transfer': return new TransferEvent(pairEvent.poolId, pairEvent.eventId, pairEvent.timestamp);
    default: throw new Error(`Unknown event type: ${data.name}`);
  }
}

const processPairEvent = async (pairEvent: InitialPairEvent): Promise<void> => {
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
    ee.id, ee.data_raw as rawdata, ee.contract_address as contractaddress, b.timestamp
  FROM evm_event as ee
  JOIN block as b
    ON ee.block_id = b.id
  WHERE ee.block_id = $1;`,
  [blockId],
);

const processBlock = async (blockId: string): Promise<void> => {
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
      timestamp: event.timestamp,
      address: event.contractaddress,
    });
  }
};
