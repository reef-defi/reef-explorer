import {Provider} from "@reef-defi/evm-provider";
import {WsProvider} from "@polkadot/api";
import {Pool} from "pg";
import { max, wait } from "./utils";
import { APP_CONFIG } from "../config";
import { logger } from "./logger";

let selectedProvider = 0;
let resolvingBlocksUntil = -1;
let nodeProviders: Provider[] = [];
let providersLastBlockId: number[] = [];
const dbProvider: Pool = new Pool({...APP_CONFIG.postgresConfig});

export let lastBlockId = -1;

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

const initializeNodeProvider = async (): Promise<void> => {
  if (APP_CONFIG.nodeUrls.length <= 0) {
    throw new Error("Minimum number of providers is 1!");
  }

  for(const url of APP_CONFIG.nodeUrls) {
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
};

export const getProvider = (): Provider => {
  if (nodeProviders.length === 0) {
    throw new Error("Non provider ")
  }
  return nodeProviders[0];
}


export const initializeProviders = async (): Promise<void> => {
  logger.info("Connecting to node...")
  await initializeNodeProvider();
  logger.info("... connected")
  logger.info("Syncing node...");
  await syncNode();
  logger.info("Syncing complete");
}

export const closeProviders = async (): Promise<void> => {
  logger.info("Closing providers");

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
}

export const insert = async (statement: string): Promise<void> => {
  await dbProvider.query(statement)
}

export const query = async <Res,>(statement: string): Promise<Res[]> => dbProvider
  .query<Res>(statement)
  .then((res: any) => res.rows)
