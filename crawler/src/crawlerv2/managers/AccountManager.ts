import {
  hexToU8a, isHex,
} from '@polkadot/util';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { utils } from 'ethers';
import { AccountBody, TokenHolder } from '../../crawler/types';
import { findNativeAddress } from '../../crawler/utils';
import { insertAccounts } from '../../queries/event';
import { insertAccountTokenHolders } from '../../queries/tokenHoldes';
import { nodeProvider } from '../../utils/connector';
import logger from '../../utils/logger';
import { REEF_CONTRACT_ADDRESS, REEF_DEFAULT_DATA, toChecksumAddress } from '../../utils/utils';

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

  static isSubstrateAddress(address: string): boolean {
    if (!address) {
      return false;
    }
    try {
      encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));
    } catch (error) {
      return false;
    }
    return true;
  }

  async use(address: string, active = true) {
    // If for some reason address is not valid, return address: 0x
    if (!AccountManager.isSubstrateAddress(address)) {
      return '0x';
    }
    // If account does not exist, we extract his info and store it
    if (!this.accounts[address]) {
      this.accounts[address] = await this.accountInfo(address);
    }

    this.accounts[address].active = active;
    return this.accounts[address];
  }

  async useEvm(evmAddress: string): Promise<string> {
    // If for some reason evmAddress is not valid, return address: 0x
    if (!utils.isAddress(evmAddress)) {
      return '0x';
    }

    // Node/Empty/Root address is presented as 0x
    if (evmAddress === '0x0000000000000000000000000000000000000000') {
      return '0x';
    }
    const address = await findNativeAddress(evmAddress);

    // Address can also be of contract and for this case node returns empty string
    // We are only processing accounts in accounts manager!
    if (address !== '') {
      await this.use(address);
      return address;
    }

    return '0x';
  }

  async save(): Promise<void> {
    const accounts = Object.keys(this.accounts);
    const usedAccounts = accounts.map((address) => this.accounts[address]);

    if (usedAccounts.length === 0) {
      return;
    }

    // Saving used accounts
    logger.info(`Updating accounts: \n\t- ${accounts.join(', \n\t- ')}`);
    await insertAccounts(usedAccounts);

    // Converting accounts into token holders
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
      }));

    // Updating account native token holder
    logger.info('Updating native token holders for used accounts');
    await insertAccountTokenHolders(tokenHolders);
  }

  private async accountInfo(address: string): Promise<AccountBody> {
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
      address,
      evmNonce,
      active: true,
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
  }
}

export default AccountManager;
