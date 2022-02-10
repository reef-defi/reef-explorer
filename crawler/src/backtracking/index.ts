import { utils } from 'ethers';
import { BacktrackingEvmEvent, EvmLogWithDecodedEvent } from '../crawler/types';
import { getContractDB, updateEvmEvents } from '../queries/evmEvent';
import { queryv2 } from '../utils/connector';
import { processTokenTransfers } from '../crawler/transfer';
import { processEvmTokenHolders } from '../crawler/tokenHolder';
import { insertTransfers } from '../queries/extrinsic';
import insertTokenHolders from '../queries/tokenHoldes';
import logger from '../utils/logger';

export default async (contractAddress: string) => {
  logger.info(`Retrieving Contracts: ${contractAddress} unverified evm events`);
  const evmEvents = await queryv2<BacktrackingEvmEvent>(`SELECT
      ee.id, ee.event_id as eventId, ee.block_id as blockId, ev.extrinsic_id as extrinsicId, ee.event_index as eventIndex, 
      ee.extrinsic_index as extrinsicIndex, ee.contract_address as contractAddress, ee.data_raw as rawData, ee.method,
      ee.type, ee.status, ex.timestamp as timestamp, ex.signed_data as signedData
    FROM evm_event as ee
    JOIN event as ev
      ON ev.id = ee.event_id
    JOIN extrinsic as ex
      ON ev.extrinsic_id = ex.id
    WHERE ee.contract_address = $1 AND ee.type = 'Unverified';`, [contractAddress]);

  logger.info(`There were ${evmEvents.length} unverified evm events`);
  const contract = await getContractDB(contractAddress);

  if (contract.length <= 0) {
    throw new Error(`Contract address: ${contractAddress} was not found in verified contract...`);
  }

  const {
    compiled_data: compiledData, name, address, type, contract_data: contractData,
  } = contract[0];
  const contractInterface = new utils.Interface(compiledData[name]);

  const processedLogs: BacktrackingEvmEvent[] = evmEvents
    .filter(({ method }) => method === 'Log')
    .map((evmEvent) => ({
      ...evmEvent,
      parseddata: contractInterface.parseLog(evmEvent.rawdata),
      type: 'Verified',
    }));

  const evmLogs: EvmLogWithDecodedEvent[] = processedLogs
    .map(({
      timestamp, blockid, rawdata, extrinsicid, signeddata, parseddata,
    }) => ({
      name,
      type,
      blockId: blockid,
      address,
      timestamp,
      signedData: signeddata,
      extrinsicId: extrinsicid,
      contractData,
      abis: compiledData,
      data: rawdata.data,
      topics: rawdata.topics,
      decodedEvent: parseddata,
      fee: signeddata,
    }));

  logger.info('Processing transfer events');
  const transfers = await processTokenTransfers(evmLogs);
  logger.info('Processing token-holder events');
  const tokenHolders = await processEvmTokenHolders(evmLogs);

  logger.info('Inserting Transfers');
  await insertTransfers(transfers);
  logger.info('Inserting Token holders');
  await insertTokenHolders(tokenHolders);
  logger.info('Updating evm events with parsed data');
  await updateEvmEvents(processedLogs);
};
