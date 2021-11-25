import { processBlocks } from "./crawler/block";
import { deleteUnfinishedBlocks, lastBlockInDatabase } from "./queries/block";
import { closeProviders, initializeProviders, nodeProvider, nodeUrls, restartNodeProviders } from "./utils/connector";
import { min, wait } from "./utils/utils";

const START_BLOCK_STEP = 32;
let BLOCKS_PER_STEP = START_BLOCK_STEP;
const MAX_BLOCKS_PER_STEP = 1024;
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
    const per = await processBlocks(from, to);
    currentBlockIndex += difference;

    const end = Date.now();
    const bps = difference/((end-start)/1000);
    console.log(`n nodes: ${nodeUrls.length}\tn blocks: ${difference}\tbps: ${bps.toFixed(3)}\tn transactions: ${per.transactions}\ttps: ${(per.transactions/((end-start)/1000)).toFixed(3)}\ttime: ${((end-start)/1000).toFixed(3)} s\tblock from ${from} to ${to}`)
    console.log(`PT1: ${(per.pt1/1000).toFixed(3)}s\tPT2: ${(per.pt2/1000).toFixed(3)}s\tPT3: ${(per.pt3/1000).toFixed(3)}s\tPT4: ${(per.pt4/1000).toFixed(3)}s\tPT5: ${(per.pt5/1000).toFixed(3)}s`)
    BLOCKS_PER_STEP = min(BLOCKS_PER_STEP * 2, MAX_BLOCKS_PER_STEP);
    
    // if (bps < 110 && difference == MAX_BLOCKS_PER_STEP) {
    //   await restartNodeProviders();
    //   BLOCKS_PER_STEP = START_BLOCK_STEP;
    // }
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
