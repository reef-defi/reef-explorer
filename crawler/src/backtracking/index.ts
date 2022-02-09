import { BacktrackingEvmEvent, EvmLogWithDecodedEvent } from "../crawler/types";
import { getContractDB, updateEvmEvents } from "../queries/evmEvent";
import { queryv2 } from "../utils/connector"
import { utils } from "ethers";
import { processTokenTransfers } from "../crawler/transfer";
import { processEvmTokenHolders } from "../crawler/tokenHolder";
import { insertTransfers } from "../queries/extrinsic";
import insertTokenHolders from "../queries/tokenHoldes";

export default async (contractAddress: string) => {
  const evmEvents = await queryv2<BacktrackingEvmEvent>(
    `SELECT 
      id, event_id as eventId, block_id as blockId, e.extrinsic_id as extrinsicId, event_index as eventIndex, 
      extrinsic_index as extrinsicIndex, contract_address as contractAddress, data_raw as rawData, method,
      type, status, extrinsic.timestamp as timestamp, extrinsic.signed_data as signedData
    FROM evm_event 
    JOIN event
      ON event.id = event_id
    JOIN extrinsic
      ON event.extrinsic_id = extrinsic.id
    WHERE address = $1 AND type = 'Unverified'`, [contractAddress]);
  const contract = await getContractDB(contractAddress);

  if (contract.length) {
    throw new Error(`Contract address: ${contractAddress} was not found in verified contract...`);
  }

  const {compiled_data: compiledData, name, address, type, contract_data: contractData} = contract[0];
  const contractInterface = new utils.Interface(compiledData[name]);

  const processedLogs: BacktrackingEvmEvent[] = evmEvents
    .filter(({method}) => method === 'Log')
    .map((evmEvent) => ({...evmEvent,
        parsedData: contractInterface.parseLog(evmEvent.rawData)
      })) 

  const evmLogs: EvmLogWithDecodedEvent[] = processedLogs
    .map(({timestamp, blockId, rawData, extrinsicId, signedData, parsedData}) => {
      return {
        name,
        type,
        blockId,
        address,
        timestamp,
        signedData,
        extrinsicId,
        contractData,
        abis: compiledData,
        data: rawData.data,
        topics: rawData.topics,
        decodedEvent: parsedData,
      };
    });

  const transfers = await processTokenTransfers(evmLogs);
  const tokenHolders = await processEvmTokenHolders(evmLogs);

  await insertTransfers(transfers);
  await insertTokenHolders(tokenHolders);
  await updateEvmEvents(processedLogs)
}