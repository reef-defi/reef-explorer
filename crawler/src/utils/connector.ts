import {Provider} from "@reef-defi/evm-provider";
import {WsProvider} from "@polkadot/api";
import {PoolClient, Pool} from "pg";
import { wait } from "./utils";

const APP_CONFIG = {
  nodeUrl: process.env.WS_PROVIDER_URL || 'ws://0.0.0.0:9944',
  postgresConfig: {
    user: process.env.POSTGRES_USER || 'reefexplorer',
    host: process.env.POSTGRES_HOST || '0.0.0.0',
    database: process.env.POSTGRES_DATABASE || 'reefexplorer',
    password: process.env.POSTGRES_PASSWORD || 'reefexplorer',
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 54321,
  }
}
export let nodeProvider: Provider;
let dbProvider: PoolClient;


const nodeHealth = async () =>
  nodeProvider.api.rpc.system.health();

const syncNode = async (): Promise<void> => {
  let node = await nodeHealth();
  while(node.isSyncing.eq(true)) {
    await wait(1000);
    node = await nodeHealth();
  };
}

// only used in index.ts!!!


const initializeNodeProvider = async (): Promise<void> => {
  nodeProvider = new Provider({
    provider: new WsProvider(APP_CONFIG.nodeUrl)
  });
  await nodeProvider.api.isReadyOrError;
};

const initializeDatabaseProvider = async (): Promise<void> => {
  const pool = new Pool({...APP_CONFIG.postgresConfig});
  dbProvider = await pool.connect();
}

export const initializeProviders = async (): Promise<void> => {
  console.log("Connecting to node...")
  await initializeNodeProvider();
  console.log("Connecting to database...")
  await initializeDatabaseProvider();
  console.log("Syncing node...");
  await syncNode();
}

export const closeProviders = async (): Promise<void> => {
  console.log("Closing providers");
  await nodeProvider.api.disconnect();
  dbProvider.release();
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