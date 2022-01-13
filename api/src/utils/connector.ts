import { Pool } from 'pg';
import { Provider } from '@reef-defi/evm-provider';
import { WsProvider } from '@polkadot/api';
import config from './config';

export const query = async <Res>(statement: string, args: any[]): Promise<Res[]> => {
  const db = new Pool({ ...config.postgresConfig });
  await db.connect();
  const result = await db.query(statement, [...args]);
  return result.rows;
};

const dbProvider: Pool = new Pool({ ...config.postgresConfig });

export const queryDb = async <Res>(statement: string): Promise<Res[]> => dbProvider
  .query<Res>(statement)
  .then((res) => res.rows);

const provider = new Provider({
  provider: new WsProvider(config.nodeWs),
});

export const getProvider = (): Provider => provider;
