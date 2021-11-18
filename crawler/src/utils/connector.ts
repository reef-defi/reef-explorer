import {Provider} from "@reef-defi/evm-provider";
import {WsProvider} from "@polkadot/api";
import {Pool} from "pg";

const APP_CONFIG = {
  nodeUrl: process.env.WS_PROVIDER_URL || 'ws://substrate-node:9944',
  postgresConfig: {
    user: process.env.POSTGRES_USER || 'reefexplorer',
    host: process.env.POSTGRES_HOST || 'postgres',
    database: process.env.POSTGRES_DATABASE || 'reefexplorer',
    password: process.env.POSTGRES_PASSWORD || 'reefexplorer',
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 54321,
  }
}

export const nodeProvider = new Provider({
  provider: new WsProvider(APP_CONFIG.nodeUrl)
});

// only used in index.ts!!!
export const dbProvider = new Pool({...APP_CONFIG.postgresConfig});


export const query = async <Res,>(statement: string): Promise<Res[]> => dbProvider
  .query<Res>(statement)
  .then((res) => res.rows);

