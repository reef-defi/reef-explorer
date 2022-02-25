import { RawEventData } from "../crawler/types";
import { queryv2 } from "../utils/connector"
import logger from "../utils/logger";
import config from "./../config"
import { utils } from "ethers";
import ReefswapPair from "../assets/ReefswapPair";
import ReefswapFactory from "../assets/ReefswapFactoryAbi";

interface DefaultPairEvent {
  poolId: string;
  eventId: string;
  timestamp: string;
}

interface InitialPairEvent extends DefaultPairEvent {
  rawData: RawEventData;
}

interface ProcessPairEvent extends DefaultPairEvent {
  data: utils.LogDescription;
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

type PariEventType = "Swap" | "Burn" | "Mint" | "Sync";
type PoolEventParameterDict = {[key: string]: any};

interface PoolEventData {
  to_address?: string;
  sender_address?: string;
  amount_1?: string;
  amount_2?: string;
  amount_in_1?: string;
  amount_in_2?: string;
  reserved_1?: string;
  reserved_2?: string;
}

const processFactoryEvent = async (evmEventId: string, rawData: RawEventData): Promise<void> => {
  logger.info("Reefswap Factory event detected!")
  const contractInterface = new utils.Interface(ReefswapFactory);
  const data = contractInterface.parseLog(rawData);

  // We are only interested PairCreate events
  if (data.name !== "PairCreated") {
    return;
  }

  const [tokenAddress1, tokenAddress2, poolAddress] = data.args as string[];

  await queryv2(
    `INSERT INTO pool 
      (evm_event_id, address, token_1, token_2)
    VALUES
      ($1, $2, $3, $4);`, 
    [evmEventId, poolAddress, tokenAddress1, tokenAddress2]
  );
}

type PoolEventKey = keyof PoolEventData;

const poolEventInsertSequence: PoolEventKey[] = ["to_address", "sender_address", "amount_1", "amount_2", "amount_in_1", "amount_in_2", "reserved_1", "reserved_2"];

const defaultPairProcess = async ({poolId, eventId, timestamp}: DefaultPairEvent, type: PariEventType, data: PoolEventParameterDict): Promise<void> => {
  logger.info(`Processing ${type} event...`)
  
  const vals = poolEventInsertSequence.map((key) => data[key] || null)
  console.log(vals);

  await queryv2(
    `INSERT INTO pool_event
      (pool_id, evm_event_id, timestamp, type, to_address, sender_address, amount_1, amount_2, amount_in_1, amount_in_2, reserved_1, reserved_2)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
    `,
    [poolId, eventId, timestamp, type, ...vals]
  )


}

const processSync = async (event: ProcessPairEvent): Promise<void> => defaultPairProcess(
  event, 
  'Sync', 
  {
    "reserved_1": event.data.args[0].toString(),
    "reserved_2": event.data.args[1].toString(),
  }
);

const processMint = async (event: ProcessPairEvent): Promise<void> => defaultPairProcess(
  event,
  'Mint',
  {
    "sender_address": event.data.args[0],
    "amount_1": event.data.args[1].toString(),
    "amount_2": event.data.args[2].toString(),
  }
)

const processBurn = async (event: ProcessPairEvent): Promise<void> => defaultPairProcess(
  event,
  'Burn',
  {
    "sender_address": event.data.args[0],
    "amount_1": event.data.args[1].toString(),
    "amount_2": event.data.args[2].toString(),
    "to_address": event.data.args[3]
  }
)

const processSwap = async (event: ProcessPairEvent): Promise<void> => defaultPairProcess(
  event,
  'Swap',
  {
    "sender_address": event.data.args[0],
    "amount_in_1": event.data.args[1].toString(),
    "amount_in_2": event.data.args[2].toString(),
    "amount_1": event.data.args[3].toString(),
    "amount_2": event.data.args[4].toString(),
    "to_address": event.data.args[5]
  }
)

const processPairEvent = async (pairEvent: InitialPairEvent): Promise<void> => {
  logger.info("Reefswap Pair event detected!");
  const contractInterface = new utils.Interface(ReefswapPair);
  const data = contractInterface.parseLog(pairEvent.rawData);

  switch(data.name) {
    case "Mint": await processMint({...pairEvent, data}); break;
    case "Burn": await processBurn({...pairEvent, data}); break;
    case "Swap": await processSwap({...pairEvent, data}); break;
    case "Sync": await processSync({...pairEvent, data}); break;
    default: break;
  }
}

const findEvmEvent = async (eventId: string): Promise<PartialEvmEvent> => {
  const evmEvents = await queryv2<PartialEvmEvent>(
    `SELECT 
      ee.id, ee.data_raw as rawdata, ee.contract_address as contractaddress, b.timestamp 
    FROM evm_event as ee
    JOIN block as b
      ON ee.block_id = b.id
    WHERE ee.id = $1;`, 
    [eventId]
  );

  if (evmEvents.length === 0) {
    throw new Error("Evm event does not exist");
  }

  return evmEvents[0];
}

const findPoolID= async (address: string): Promise<string|undefined> => {
  const ids = await queryv2<ID>('SELECT id FROM pool WHERE address = $1', [address]);
  return ids.length > 0 ? ids[0].id : undefined
}

export default async (eventId: string): Promise<void> => {
  logger.info(`Processing event: ${eventId}`)
  const event = await findEvmEvent(eventId);

  // Check if event is Reefswap factory create pool event. If so add new pool in DB
  if (event.contractaddress.toLowerCase() === config.reefswapFactoryAddress.toLowerCase()) {
    await processFactoryEvent(eventId, event.rawdata);
    return;
  }

  // Check if current event address is in pools table 
  // If so process pool event accordingly 
  const poolId = await findPoolID(event.contractaddress);
  if (poolId) {
    await processPairEvent({
      eventId,
      poolId: poolId,
      rawData: event.rawdata,
      timestamp: event.timestamp
    });
    return;
  }
}