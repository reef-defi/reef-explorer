import { AccountBody } from "../crawler/types";

// Account manager stores used accounts and allows to trigger account save
class AccountManager {
  blockId: number;
  blockTimestamp: string;
  accounts: {[address: string]: AccountBody};

  constructor(blockId: number, timestamp: string) {
    this.accounts = {};
    this.blockId = blockId;
    this.blockTimestamp = timestamp;
  }

  async use(address: string) {
    if (!this.accounts[address]) {
      return this.accounts[address];
    }
  }

  async save(): Promise<void> {

  }
}

export default AccountManager;