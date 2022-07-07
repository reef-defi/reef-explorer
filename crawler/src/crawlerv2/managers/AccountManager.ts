import { AccountBody, TokenHolder } from "../../crawler/types";
import { insertAccounts } from "../../queries/event";
import { nodeProvider } from "../../utils/connector";
import logger from "../../utils/logger";
import { REEF_CONTRACT_ADDRESS, REEF_DEFAULT_DATA, toChecksumAddress } from "../../utils/utils";
import insertTokenHolders from './../../queries/tokenHoldes';

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
    const usedAccounts = Object.keys(this.accounts)
      .map((address) => this.accounts[address]);
    // Saving used accounts
    logger.info('Updating used accounts');
    await insertAccounts(usedAccounts);

    const tokenHolders: TokenHolder[] = usedAccounts
      .map((account) => ({
        timestamp: account.timestamp,
        signerAddress: account.address,
        tokenAddress: REEF_CONTRACT_ADDRESS,
        info: { ...REEF_DEFAULT_DATA },
        balance: account.freeBalance,
        type: 'Account',
        evmAddress: '',
        nftId: null,
      })) 

    // Updating account native token holder
    logger.info('Updating native token holders for used accounts');
    await insertTokenHolders(tokenHolders);
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