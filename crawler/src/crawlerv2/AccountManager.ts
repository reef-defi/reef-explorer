import { AccountBody } from "../crawler/types";
import { insertAccounts } from "../queries/event";
import { nodeProvider } from "../utils/connector";
import { toChecksumAddress } from "../utils/utils";

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

  async use(address: string, active=true) {
    // If account does not exist, we extract his info and store it 
    if (!this.accounts[address]) {
      this.accounts[address] = await this.accountInfo(address, active);
    }
    return this.accounts[address];
  }

  async save(): Promise<void> {
    const usedAccounts = Object.keys(this.accounts);
    // Saving used accounts
    await insertAccounts(
      usedAccounts.map((address) => this.accounts[address])
    );
  }

  private async accountInfo (address: string, active: boolean): Promise<AccountBody> {
    const [evmAddress, balances, identity] = await Promise.all([
      nodeProvider.query((provider) => provider.api.query.evmAccounts.evmAddresses(address)),
      nodeProvider.query((provider) => provider.api.derive.balances.all(address)),
      nodeProvider.query((provider) => provider.api.derive.accounts.identity(address)),
    ]);

    // TODO clean below code
    const addr = evmAddress.toString();
    const evmAddr = addr !== ''
      ? toChecksumAddress(addr)
      : addr;
  
    const evmNonce: string | null = addr !== ''
      ? await nodeProvider.query((provider) => provider.api.query.evm.accounts(addr))
        .then((res): any => res.toJSON())
        .then((res) => res?.nonce || 0)
      : 0;
  
    return {
      active,
      address,
      evmNonce,
      evmAddress: evmAddr,
      blockId: this.blockId,
      timestamp: this.blockTimestamp,
      freeBalance: balances.freeBalance.toString(),
      lockedBalance: balances.lockedBalance.toString(),
      availableBalance: balances.availableBalance.toString(),
      vestedBalance: balances.vestedBalance.toString(),
      votingBalance: balances.votingBalance.toString(),
      reservedBalance: balances.reservedBalance.toString(),
      identity: JSON.stringify(identity),
      nonce: balances.accountNonce.toString(),
    };
  };
}

export default AccountManager;