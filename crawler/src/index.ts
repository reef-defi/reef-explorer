import { processBlock, processBlocks } from "./crawler/block";
import { lastBlockInDatabase } from "./queries/block";
import { closeProviders, initializeProviders, nodeProvider } from "./utils/connector";
import { min, wait } from "./utils/utils";

const MAX_BLOCKS_PER_STEP = 1000;
const HARVESTING_DIFFERENCE_TRASHOLE = 10;
let currentBlockIndex = -1;
let latestBlockIndex = -1;

const processNextBlock = async () => {
  while (currentBlockIndex + 1 <= latestBlockIndex) {
    console.time("Processing time")
    const difference = min(latestBlockIndex - currentBlockIndex + 1, MAX_BLOCKS_PER_STEP);
    await processBlocks(currentBlockIndex + 1, currentBlockIndex + difference + 1);
    currentBlockIndex += difference;
    console.timeEnd("Processing time")
    // if (difference > HARVESTING_DIFFERENCE_TRASHOLE) {
    // } else {
    //   currentBlockIndex += 1;
    //   await processBlock(currentBlockIndex);
    // }
    // process.exit();

  };

  await wait(100);
  await processNextBlock();
}

Promise.resolve()
  .then(initializeProviders)
  .then(async () => currentBlockIndex = await lastBlockInDatabase())
  // .then(async () => currentBlockIndex = 609157-1)
  .then(() => nodeProvider.api.rpc.chain.subscribeNewHeads((header) => {
    latestBlockIndex = header.number.toNumber();
  }))
  .then(processNextBlock)
  // .then(() => processBlock(4987))
  .catch((error) => {
    console.error(error);
    process.exit(-1);
  })
  .finally(closeProviders)
