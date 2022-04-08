import { Pool } from 'pg';
import format from 'pg-format';
import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client/core';
import APP_CONFIG from '../config';
import NodeProvider from './NodeProvider';
import 'cross-fetch/polyfill';

const dbProvider: Pool = new Pool({ ...APP_CONFIG.postgresConfig });
export const nodeProvider = new NodeProvider(APP_CONFIG.nodeUrls);

export type GraphqlServer = ApolloClient<NormalizedCacheObject>;
export const liveGraphqlServer: GraphqlServer = new ApolloClient({
  uri: APP_CONFIG.liveGraphqlUrl,
  cache: new InMemoryCache(),
});

export const insert = async (statement: string): Promise<void> => {
  await dbProvider.query(statement);
};

export const insertV2 = async (statement: string, args: any[]) => {
  if (args.length === 0) { return; }
  await dbProvider.query(format(statement, args));
};

export const query = async <Res, >(statement: string): Promise<Res[]> => {
  const client = await dbProvider.connect();
  const result = await client.query<Res>(statement);
  client.release();
  return result.rows;
};

export const queryv2 = async <Res, >(statement: string, args = [] as any[]): Promise<Res[]> => {
  const client = await dbProvider.connect();
  const result = await client.query<Res>(statement, args);
  client.release();
  return result.rows;
};
