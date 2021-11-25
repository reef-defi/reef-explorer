import { processBlocks } from "./crawler/block";
import { deleteUnfinishedBlocks, lastBlockInDatabase } from "./queries/block";
import { closeProviders, initializeProviders, nodeProvider, nodeUrls } from "./utils/connector";
import { min, wait } from "./utils/utils";

let BLOCKS_PER_STEP = 32;
const MAX_BLOCKS_PER_STEP = 2048;
const HARVESTING_DIFFERENCE_TRASHOLE = 10;
let currentBlockIndex = -1;
let latestBlockIndex = -1;

console.warn = () => {};

const processNextBlock = async () => {
  while (currentBlockIndex + 1 <= latestBlockIndex) {
    const start = Date.now();

    const difference = min(latestBlockIndex - currentBlockIndex, BLOCKS_PER_STEP);
    const from = currentBlockIndex + 1;
    const to = from + difference;
    await processBlocks(from, to);
    currentBlockIndex += difference;

    const end = Date.now();
    console.log(`n nodes: ${nodeUrls.length}\tn blocks: ${difference}\tbps: ${(difference/((end-start)/1000)).toFixed(3)}\ttime: ${((end-start)/1000).toFixed(3)} s\tblock from ${from} to ${to}`)
    
    BLOCKS_PER_STEP = min(BLOCKS_PER_STEP * 2, MAX_BLOCKS_PER_STEP);
  };

  await wait(100);
  await processNextBlock();
}

Promise.resolve()
  .then(initializeProviders)
  .then(deleteUnfinishedBlocks)
  .then(async () => currentBlockIndex = await lastBlockInDatabase())
  // .then(async () => currentBlockIndex = 609157-1)
  .then(() => nodeProvider.api.rpc.chain.subscribeNewHeads((header) => {
    latestBlockIndex = header.number.toNumber();
  }))
  .then(processNextBlock)
  .catch((error) => {
    console.error(error);
    process.exit(-1);
  })
  .finally(closeProviders)
