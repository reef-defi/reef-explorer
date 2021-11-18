import { processBlock } from "./crawler/block";
import { lastBlockInDatabase } from "./queries/block";
import { closeProviders, initializeProviders, nodeProvider } from "./utils/connector";
const { performance } = require('perf_hooks');

const crawlData = async (): Promise<void> => {
  console.log("Starting harvesting data...")
  let blockIndex = await lastBlockInDatabase() + 1;
  let lastNodeBlockNumber = await nodeProvider.getBlockNumber();
  let startTime = performance.now();
  console.log("Last block in database: ", blockIndex);

  while (blockIndex < lastNodeBlockNumber) {
    if (blockIndex % 1000 === 0) {
      console.log(`Processing block ${blockIndex}, 1k blocks per ${(performance.now() - startTime / 1000).toFixed(3)} s`)
      startTime = performance.now();
    }

    await processBlock(blockIndex);
    blockIndex += 1;
    lastNodeBlockNumber = await nodeProvider.getBlockNumber();
  };

  console.log("Starting to ")
  listenToNewBlocks();
}

const listenToNewBlocks = () => {
  nodeProvider.api.rpc.chain.subscribeNewHeads(async (header) => {
    // TODO add safty check if the last block in db is really header.number + 1! 
    // If it is not, cancle subscription and run crawlData function!
    await processBlock(header.number.toNumber())
  });
}

Promise.resolve()
  .then(initializeProviders)
  .then(crawlData)
  .catch((error) => {
    console.error(error);
    process.exit(-1);
  })
  .finally(closeProviders)
