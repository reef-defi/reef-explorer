import { EVMEventData, EvmLogWithDecodedEvent } from "../crawler/types";
import { getContractDB } from "../queries/evmEvent";
import { queryv2 } from "../utils/connector"
import { utils } from "ethers";
import { processTokenTransfers } from "../crawler/transfer";
import { processEvmTokenHolders } from "../crawler/tokenHolder";
import { insertTransfers } from "../queries/extrinsic";
import insertTokenHolders from "../queries/tokenHoldes";

export default async (contractAddress: string) => {
  // TODO update query with appropriet types
  // TODO inject query interface
  const evmEvents = await queryv2<EVMEventData>('SELECT * FROM evm_event WHERE address = $1 AND type = \'Unverified\'', [contractAddress]);
  const contract = await getContractDB(contractAddress);

  if (contract.length) {
    throw new Error(`Contract address: ${contractAddress} was not found in verified contract...`);
  }

  const {compiled_data: compiledData, name, address, type, contract_data: contractData} = contract[0];
  const contractInterface = new utils.Interface(compiledData[name]);

  const evmLogs: EvmLogWithDecodedEvent[] = evmEvents
    .filter(({method}) => method === 'Log')
    .map(({timestamp, blockId, data}) => {
      const decodedEvent = contractInterface.parseLog(rawData);

      return {
        name,
        type,
        blockId,
        address,
        timestamp,
        extrinsicId,
        contractData,
        decodedEvent,
        abis: compiledData,
        data: rawData.data,
        topics: rawData.topics,
        signedData: {fee: 0, feeDetails: 0} // TODO extract signed data from extrinsic
      };
    });

  const transfers = await processTokenTransfers(evmLogs);
  const tokenHolders = await processEvmTokenHolders(evmLogs);
  // TODO Update evm events which were verified

  await insertTransfers(transfers);
  await insertTokenHolders(tokenHolders);
}