import { processBlock } from "./crawler/block";
import { lastBlockInDatabase } from "./queries/block";
import { closeProviders, initializeProviders, nodeProvider } from "./utils/connector";
import { wait } from "./utils/utils";

let currentBlockIndex = -1;
let latestBlockIndex = -1;

const processNextBlock = async () => {
  while (currentBlockIndex + 1 <= latestBlockIndex) {
    currentBlockIndex += 1;
    await processBlock(currentBlockIndex);
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
