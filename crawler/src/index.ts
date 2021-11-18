import { dbProvider, nodeProvider } from "./utils/connector";
import { wait } from "./utils/utils";


const nodeHealth = async () => nodeProvider.api.rpc.system.health();

const syncNode = async (): Promise<void> => {
  console.log("Syncing node");
  const node = await nodeHealth();
  console.log(node)
  while(node.isSyncing) {
    await wait(1000)
  };
}


const runner = async (): Promise<void> => {
  console.log("Connecting to node...")
  await nodeProvider.api.isReadyOrError
  console.log("Connecting to database...")
  await dbProvider.connect();

  await syncNode();
};

Promise.resolve()
  .then(() => runner())
  .catch((error) => {
    console.error(error);
    process.exit(-1);
  });
