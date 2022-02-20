import { Provider } from "@reef-defi/evm-provider";
import { WsProvider } from "@polkadot/api";
import { max, wait } from "./utils";
import logger from "./logger";

export default class NodeProvider {
  private urls: string[];

  private dbBlockId = -1;

  private currentProvider = 0;

  private providers: Provider[] = [];

  private lastBlockIds: number[] = [];

  private lastFinalizedBlockIds: number[] = [];

  constructor(urls: string[]) {
    this.urls = [...urls];
  }

  setDbBlockId(id: number) {
    this.dbBlockId = id;
  }

  lastBlockId() {
    return max(...this.lastBlockIds);
  }

  lastFinalizedBlockId() {
    return max(...this.lastFinalizedBlockIds);
  }

  getProvider() {
    if (this.providers.length === 0) {
      throw new Error("Initialize providers! Non was detected");
    }
    const pointer = this.currentProvider;
    this.currentProvider = (this.currentProvider + 1) % this.providers.length;
    return this.providers[pointer];
  }

  /* eslint "no-unused-vars": "off" */
  async query<T>(fun: (provider: Provider) => Promise<T>): Promise<T> {
    this.currentProvider = (this.currentProvider + 1) % this.providers.length;
    while (this.lastBlockIds[this.currentProvider] < this.dbBlockId) {
      this.currentProvider = (this.currentProvider + 1) % this.providers.length;
    }
    const providerPointer = this.providers[this.currentProvider];
    return fun(providerPointer);
  }

  async initializeProviders(): Promise<void> {
    logger.info("Connecting to nodes...");
    await this.initializeNodeProviders();
    logger.info("... connected");
    logger.info("Syncing node...");
    await this.syncNode();
    logger.info("Syncing complete");
  }

  async closeProviders(): Promise<void> {
    logger.info("Closing providers");

    for (let index = 0; index < this.providers.length; index += 1) {
      await this.providers[index].api.disconnect();
    }

    this.providers = [];
    this.lastBlockIds = [];
    this.lastFinalizedBlockIds = [];
  }

  async restartNodeProviders(): Promise<void> {
    await this.closeProviders();
    await this.initializeProviders();
  }

  private async areNodesSyncing(): Promise<boolean> {
    for (let index = 0; index < this.providers.length; index += 1) {
      const node = await this.providers[index].api.rpc.system.health();
      if (node.isSyncing.eq(true)) {
        return true;
      }
    }
    return false;
  }

  private async syncNode(): Promise<void> {
    while (await this.areNodesSyncing()) {
      await wait(1000);
    }
  }

  private async initializeNodeProviders() {
    logger.info("Inside");
    for (let index = 0; index < this.urls.length; index += 1) {
      const provider = new Provider({
        provider: new WsProvider(this.urls[index]),
      });
      await provider.api.isReadyOrError;
      this.providers.push(provider);
      this.lastBlockIds.push(-1);
    }

    for (let index = 0; index < this.providers.length; index += 1) {
      this.providers[index].api.rpc.chain.subscribeFinalizedHeads(
        async (header) => {
          this.lastFinalizedBlockIds[index] = header.number.toNumber();
        }
      );
      this.providers[index].api.rpc.chain.subscribeNewHeads(async (header) => {
        this.lastBlockIds[index] = header.number.toNumber();
      });
    }
  }
}
