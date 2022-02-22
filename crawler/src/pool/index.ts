import { BacktrackingEvmEvent, EvmLogWithDecodedEvent, RawEventData } from "../crawler/types";
import { getContractDB } from "../queries/evmEvent";
import { insertV2, queryv2 } from "../utils/connector"
import logger from "../utils/logger";
import config from "./../config"
import { utils } from "ethers";
import ReefswapPair from "../assets/ReefswapPair";
import ReefswapFactory from "../assets/ReefswapFactoryAbi";

const processFactoryEvent = async (evmEventId: string, rawData: RawEventData): Promise<void> => {
  logger.info("Reefswap Factory event detected!")
  const contractInterface = new utils.Interface(ReefswapFactory);
  const data = contractInterface.parseLog(rawData);

  console.log("Factory event")
  console.log(data);
  console.log("-------------")

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

type PoolEventParameterDict = {[key: string]: any};

const defaultPairProcess = async ({poolId, eventId, timestamp}: DefaultPairEvent, type: string, data: PoolEventParameterDict): Promise<void> => {
  const keys = Object.keys(data);
  const values = keys.map((key) => data[key]);
  await queryv2(
    `INSERT INTO pool_event
      (pool_id, evm_event_id, timestamp, type, ${keys.join(", ")})
    VALUES
      ($1, $2, $3, $4, ${keys.map((_, index) => `$${index + 5}`).join(", ")});
    `,
    [poolId, eventId, timestamp, type, ...values]
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

  console.log("Pair event")
  console.log(data)
  console.log(data.args[0])
  console.log("-----------------------")
  switch(data.name) {
    case "Mint": await processMint({...pairEvent, data}); break;
    case "Burn": await processBurn({...pairEvent, data}); break;
    case "Swap": await processSwap({...pairEvent, data}); break;
    case "Sync": await processSync({...pairEvent, data}); break;
    default: break;
  }
}

export default async (eventId: string) => {
  logger.info(`Processing event: ${eventId}`)
  const evmEvents = await queryv2<BacktrackingEvmEvent>(
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
  const event = evmEvents[0];
  // TODO repare 
  // Check if event is Reefswap factory create pool event. If so add new pool in DB
  if (event.contractaddress.toLowerCase() === config.reefswapFactoryAddress.toLowerCase()) {
    // TODO extract pool info and save it
    await processFactoryEvent(eventId, event.rawdata);
  }

  // Check if current event address is in pools table 
  // If so process pool event accordingly 
  const res = await queryv2<{id: string}>('SELECT id FROM pool WHERE address = $1', [event.contractaddress]);
  if (res.length > 0) {
    await processPairEvent({
      eventId,
      poolId: res[0].id,
      rawData: event.rawdata,
      timestamp: event.timestamp
    });
  }

}