import { processBlock, processBlocks } from "./crawler/block";
import { lastBlockInDatabase } from "./queries/block";
import { closeProviders, initializeProviders, nodeProvider, nodeUrls } from "./utils/connector";
import { min, wait } from "./utils/utils";

let BLOCKS_PER_STEP = 4096;
const HARVESTING_DIFFERENCE_TRASHOLE = 10;
let currentBlockIndex = -1;
let latestBlockIndex = -1;

console.warn = () => {};

const processNextBlock = async () => {
  while (currentBlockIndex + 1 <= latestBlockIndex) {
    const start = Date.now();
    const difference = min(latestBlockIndex - currentBlockIndex + 1, BLOCKS_PER_STEP);
    await processBlocks(currentBlockIndex + 1, currentBlockIndex + difference + 1);
    currentBlockIndex += difference;
    const end = Date.now();
    
    console.log(`n nodes: ${nodeUrls.length}\tn blocks: ${BLOCKS_PER_STEP}\tbps: ${(difference/((end-start)/1000)).toFixed(3)}\ttime: ${end-start} ms`)


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
