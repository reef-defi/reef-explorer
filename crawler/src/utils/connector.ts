import {Provider} from "@reef-defi/evm-provider";
import {WsProvider} from "@polkadot/api";
import {PoolClient, Pool} from "pg";

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

// only used in index.ts!!!
export let nodeProvider: Provider;
export let dbProvider: PoolClient;


export const initializeNodeProvider = async (): Promise<void> => {
  nodeProvider = new Provider({
    provider: new WsProvider(APP_CONFIG.nodeUrl)
  });
  await nodeProvider.api.isReadyOrError;
};

export const initializeDatabaseProvider = async (): Promise<void> => {
  const pool = new Pool({...APP_CONFIG.postgresConfig});
  dbProvider = await pool.connect();
}

export const query = async <Res,>(statement: string): Promise<Res[]> => dbProvider
  .query<Res>(statement)
  .then((res) => res.rows);