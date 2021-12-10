import {Pool} from "pg";
import { APP_CONFIGURATION } from "./config";
import { Provider } from "@reef-defi/evm-provider";
import { WsProvider} from '@polkadot/api';

export const query = async <Res>(statement: string, args: any[]): Promise<Res[]> => {
  const db = new Pool({...APP_CONFIGURATION.postgresConfig});
  await db.connect();
  const result = await db.query(statement, [...args]);
  return result.rows;
}

const dbProvider: Pool = new Pool({...APP_CONFIGURATION.postgresConfig});

export const queryDb = async <Res>(statement: string): Promise<Res[]> => dbProvider
  .query<Res>(statement)
  .then((res) => res.rows);

const provider = new Provider({
  provider: new WsProvider(APP_CONFIGURATION.nodeWs)
});

export const getProvider = (): Provider => provider;