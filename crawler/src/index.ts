import { APP_CONFIG } from "./config";
import { processBlocks } from "./crawler/block";
import { deleteUnfinishedBlocks, lastBlockInDatabase } from "./queries/block";
import { closeProviders, initializeProviders, lastBlockId, restartNodeProviders } from "./utils/connector";
import { min, wait } from "./utils/utils";

let BLOCKS_PER_STEP = APP_CONFIG.startBlockSize;
let currentBlockIndex = -1;

console.warn = () => {};

const processNextBlock = async () => {
  while (currentBlockIndex < lastBlockId) {
    
    const difference = min(lastBlockId - currentBlockIndex, BLOCKS_PER_STEP);
    const from = currentBlockIndex + 1;
    const to = from + difference;
    
    const start = Date.now();
    const per = await processBlocks(from, to)
      .then((p) => {
        currentBlockIndex = to - 1
        return p;
      })
      .catch(async (err) => {
        console.error(err);
        await deleteUnfinishedBlocks();
        await restartNodeProviders();
        return {
          nodeTime: 1,
          dbTime: 1,
          processingTime: 1,
          transactions: 0,
        }
      })

    const ms = Date.now() - start
    const time = ms/1000;
    const bps = difference/time;

    console.log(`n nodes: ${APP_CONFIG.nodeUrls.length}\tn blocks: ${difference}\tbps: ${bps.toFixed(3)}\tn transactions: ${per.transactions}\ttps: ${(per.transactions/time).toFixed(3)}\ttime: ${time.toFixed(3)} s\tblock from ${from} to ${to}`)
    console.log(`\t\tPerformance\tNode: ${(per.nodeTime / ms * 100).toFixed(2)}%\tDB: ${(per.dbTime/ms*100).toFixed(2)}%\tSys: ${(per.processingTime/ms*100).toFixed(2)}%`)
    BLOCKS_PER_STEP = min(BLOCKS_PER_STEP * 2, APP_CONFIG.maxBlocksPerStep);    
  };

  await wait(100);
  await processNextBlock();
}


Promise.resolve()
  .then(initializeProviders)
  .then(deleteUnfinishedBlocks)
  .then(async () => {
    currentBlockIndex = await lastBlockInDatabase();
  })
  .then(processNextBlock)
  .catch((error) => {
    console.error(error);
    process.exit(-1);
  })
  .finally(closeProviders)
