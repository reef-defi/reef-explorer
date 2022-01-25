import { Provider } from '@reef-defi/evm-provider';
import { WsProvider } from '@polkadot/api';
import { Pool } from 'pg';
import { max, wait } from './utils';
import APP_CONFIG from '../config';
import logger from './logger';

let lastBlockId = -1;
let selectedProvider = 0;
let resolvingBlocksUntil = -1;
let nodeProviders: Provider[] = [];
let providersLastBlockId: number[] = [];
const dbProvider: Pool = new Pool({ ...APP_CONFIG.postgresConfig });

export const setResolvingBlocksTillId = (id: number) => {
  resolvingBlocksUntil = id;
};

export const getLastBlockId = (): number => lastBlockId;

/* eslint "no-unused-vars": "off" */
export const nodeQuery = async <T>(
  fun: (provider: Provider) => Promise<T>,
): Promise<T> => {
  selectedProvider = (selectedProvider + 1) % nodeProviders.length;
  while (providersLastBlockId[selectedProvider] < resolvingBlocksUntil) {
    selectedProvider = (selectedProvider + 1) % nodeProviders.length;
  }
  const providerPointer = nodeProviders[selectedProvider];
  return fun(providerPointer);
};

const areNodesSyncing = async () => {
  for (let index = 0; index < nodeProviders.length; index += 1) {
    const node = await nodeProviders[index].api.rpc.system.health();
    if (node.isSyncing.eq(true)) {
      return true;
    }
  }
  return false;
};

export const syncNode = async (): Promise<void> => {
  while (await areNodesSyncing()) {
    await wait(1000);
  }
};

const updateProviderLastBlock = (index: number, blockNumber: number): void => {
  providersLastBlockId[index] = blockNumber;
  lastBlockId = max(...providersLastBlockId);
};

const initializeNodeProvider = async (): Promise<void> => {
  if (APP_CONFIG.nodeUrls.length <= 0) {
    throw new Error('Minimum number of providers is 1!');
  }
  logger.info(`Initializing ${APP_CONFIG.nodeUrls.length} providers`);

  for (let index = 0; index < APP_CONFIG.nodeUrls.length; index += 1) {
    const url = APP_CONFIG.nodeUrls[index];
    const provider = new Provider({
      provider: new WsProvider(url),
    });
    await provider.api.isReadyOrError;
    nodeProviders.push(provider);
    providersLastBlockId.push(-1);
  }

  for (let index = 0; index < nodeProviders.length; index += 1) {
    nodeProviders[index].api.rpc.chain.subscribeNewHeads(async (header) => {
      updateProviderLastBlock(index, header.number.toNumber());
    });
  }
};

export const getProvider = (): Provider => {
  if (nodeProviders.length === 0) {
    throw new Error('Non provider ');
  }
  return nodeProviders[0];
};

export const initializeProviders = async (): Promise<void> => {
  logger.info('Connecting to nodes...');
  await initializeNodeProvider();
  logger.info('... connected');
  logger.info('Syncing node...');
  await syncNode();
  logger.info('Syncing complete');
};

export const closeProviders = async (): Promise<void> => {
  logger.info('Closing providers');

  nodeProviders.forEach(async (provider) => {
    await provider.api.disconnect();
  });
  nodeProviders = [];
  providersLastBlockId = [];
};

export const restartNodeProviders = async (): Promise<void> => {
  await closeProviders();
  await initializeProviders();
};

export const insert = async (statement: string): Promise<void> => {
  await dbProvider.query(statement);
};

export const insertV2 = async (statement: string, args: any[]) => {
  await dbProvider.query(statement, args);
}

export const query = async <Res, >(statement: string): Promise<Res[]> => {
  const client = await dbProvider.connect();
  const result = await client.query<Res>(statement);
  client.release();
  return result.rows;
}