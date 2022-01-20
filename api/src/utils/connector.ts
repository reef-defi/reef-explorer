import { Pool } from 'pg';
import { Provider } from '@reef-defi/evm-provider';
import { WsProvider } from '@polkadot/api';
import config from './config';

const db = new Pool({ ...config.postgresConfig });

export const query = async <Res>(statement: string, args: any[]): Promise<Res[]> => {
  const client = await db.connect();
  const result = await db.query(statement, [...args]);
  client.release();
  return result.rows;
};

const provider = new Provider({
  provider: new WsProvider(config.nodeWs),
});

export const getProvider = (): Provider => provider;
