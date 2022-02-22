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

const processSync = async ({poolId, eventId, timestamp, data}: ProcessPairEvent): Promise<void> => {
  await queryv2(
    `INSERT INTO pool_event
      (pool_id, evm_event_id, type, reserved_1, reserved_2, timestamp)
    VALUES
      ($1, $2, $3, $4, $5, $6);
    `,
    [poolId, eventId, 'Sync', data.args[0].toString(), data.args[1].toString(), timestamp]
  )
}

const processMint = async ({poolId, eventId, data, timestamp}: ProcessPairEvent): Promise<void> => {
  await queryv2(
    `INSERT INTO pool_event
      (pool_id, evm_event_id, type, sender_address, amount_1, amount_2, timestamp)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7);
    `,
    [poolId, eventId, 'Mint', data.args[0], data.args[1].toString(), data.args[2].toString(), timestamp]
  )
}

const processBurn = async ({poolId, eventId, data, timestamp}: ProcessPairEvent): Promise<void> => {
  process.exit()
  // await queryv2(
  //   `INSERT INTO pool_event
  //     (pool_id, evm_event_id, type, sender_address, amount_1, amount_2, timestamp)
  //   VALUES
  //     ($1, $2, $3, $4, $5, $6, $7);
  //   `,
  //   [poolId, eventId, 'Mint', data.args[0], data.args[1].toString(), data.args[2].toString(), timestamp]
  // )
}

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
    case "Swap": process.exit(); break;
    case "Sync": processSync({...pairEvent, data}); break;
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