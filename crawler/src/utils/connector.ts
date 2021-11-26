import {Provider} from "@reef-defi/evm-provider";
import {WsProvider} from "@polkadot/api";
import {Pool} from "pg";
import { max, min, wait } from "./utils";

const APP_CONFIG = {
  nodeUrl: process.env.WS_PROVIDER_URL || 'ws://0.0.0.0:9951',
  nodeSize: 10,
  postgresConfig: {
    user: process.env.POSTGRES_USER || 'reefexplorer',
    host: process.env.POSTGRES_HOST || '0.0.0.0',
    database: process.env.POSTGRES_DATABASE || 'reefexplorer',
    password: process.env.POSTGRES_PASSWORD || 'reefexplorer',
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 54321,
  }
}

export const nodeUrls = [
  // 'ws://127.0.0.1:9944'
  'ws://0.0.0.0:9944',
  'ws://0.0.0.0:9945',
  // 'ws://0.0.0.0:9946',
  // 'ws://0.0.0.0:9947',
  // 'ws://0.0.0.0:9948',
  // 'ws://0.0.0.0:9949',
  // 'ws://0.0.0.0:9950',
  // 'ws://0.0.0.0:9951',
]

let selectedProvider = 0;
let nodeProviders: Provider[] = [];
let providersLastBlockId: number[] = [];

export let nodeProvider: Provider;
let dbProvider: Pool = new Pool({...APP_CONFIG.postgresConfig});

let resolvingBlocksUntil = -1;

export const setResolvingBlocksTillId = (id: number) => {
  resolvingBlocksUntil = id;
}

export const nodeQuery = async <T,>(fun: (provider: Provider) => Promise<T>): Promise<T> => {
  selectedProvider = (selectedProvider + 1) % nodeProviders.length;
  while (providersLastBlockId[selectedProvider] < resolvingBlocksUntil) {
    selectedProvider = (selectedProvider + 1) % nodeProviders.length;
  }
  const providerPointer = nodeProviders[selectedProvider];
  return fun(providerPointer);
}

const areNodesSyncing = async () => {
  for (const provider of nodeProviders) {
    const node = await provider.api.rpc.system.health();
    if (node.isSyncing.eq(true)) {
      return true;
    }
  }
  return false;
}

export const syncNode = async (): Promise<void> => {
  while(await areNodesSyncing()) {
    await wait(1000);
  };
}
export let lastBlockId = -1;

const initializeNodeProvider = async (): Promise<void> => {
  if (nodeUrls.length <= 0) {
    throw new Error("Minimum number of providers is 1!");
  }

  for(const url of nodeUrls) {
    const provider =  new Provider({
      provider: new WsProvider(url)
    });
    await provider.api.isReadyOrError;
    nodeProviders.push(provider);
    providersLastBlockId.push(-1);
  }

  for (let index = 0; index < nodeProviders.length; index++) {
    nodeProviders[index].api.rpc.chain.subscribeNewHeads(async (header) => {
      providersLastBlockId[index] = header.number.toNumber();
      lastBlockId = max(...providersLastBlockId);
    })
  }

  nodeProvider = new Provider({
    provider: new WsProvider(nodeUrls[0])
  });
  await nodeProvider.api.isReadyOrError;
};


export const initializeProviders = async (): Promise<void> => {
  console.log("Connecting to node...")
  await initializeNodeProvider();
  console.log("Syncing node...");
  await syncNode();
  console.log("Syncing complete");
}

export const closeProviders = async (): Promise<void> => {
  console.log("Closing providers");
  await nodeProvider.api.disconnect();

  for (const provider of nodeProviders) {
    await provider.api.disconnect();
  }
  nodeProviders = [];
  providersLastBlockId = [];
}

export const restartNodeProviders = async(): Promise<void> => {
  await closeProviders();
  await initializeProviders();
}


export const insertAndGetId = async (statement: string, table: string): Promise<number> => {
  // console.log(statement)
  return dbProvider
    .query(`${statement} SELECT currval(pg_get_serial_sequence('${table}','id'));`)
    // TODO find out how to correctly tipe this!!
    .then((res: any) => res[1].rows[0].currval)
    .catch((error) => {
      console.log(`------------------- Error: \n${statement}\n\n${error}`);
      return -1; 
    })
}

export const insert = async (statement: string): Promise<void> => {
  await dbProvider.query(statement)
  .catch((error) => {
    console.log(`------------------- Error: \n${statement}\n\n${error}`);
  })
}

export const query = async <Res,>(statement: string): Promise<Res[]> => dbProvider
  .query<Res>(statement)
  .then((res) => res.rows)
  .catch((error) => {
    console.log(`------------------- Error: \n${statement}\n\n${error}`);
    return []; 
  })