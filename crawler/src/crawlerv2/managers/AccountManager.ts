import { AccountBody, TokenHolder } from '../../crawler/types';
import { findNativeAddress } from '../../crawler/utils';
import { insertAccountTokenHolders } from '../../queries/tokenHoldes';
import { nodeProvider, queryv2 } from '../../utils/connector';
import logger from '../../utils/logger';
import { REEF_CONTRACT_ADDRESS, REEF_DEFAULT_DATA, toChecksumAddress } from '../../utils/utils';

// accounts statement first locks the accounts table and then inserts or updates used accounts
// latest timestamp is used to update the accounts table
// ** using <VALUES> syntax to inject values into the query because of integer overflow
const INSERT_ACCOUTNS_STATEMENT = `
BEGIN;

SELECT * FROM account FOR UPDATE;

INSERT INTO account
  (address, evm_address, block_id, active, free_balance, locked_balance, available_balance, reserved_balance, voting_balance, vested_balance, identity, nonce, evm_nonce, timestamp)
VALUES
  <VALUES>
ON CONFLICT (address) DO UPDATE SET
  active = EXCLUDED.active,
  block_id = EXCLUDED.block_id,
  evm_address = EXCLUDED.evm_address,
  free_balance = EXCLUDED.free_balance,
  locked_balance = EXCLUDED.locked_balance,
  vested_balance = EXCLUDED.vested_balance,
  voting_balance = EXCLUDED.voting_balance,
  reserved_balance = EXCLUDED.reserved_balance,
  available_balance = EXCLUDED.available_balance,
  timestamp = EXCLUDED.timestamp,
  nonce = EXCLUDED.nonce,
  evm_nonce = EXCLUDED.evm_nonce,
  identity = EXCLUDED.identity;

COMMIT;
`;

const account2Insert = (account: AccountBody): string => 
`('${account.address}', '${account.evmAddress}', ${account.blockId}, ${account.active}, ${account.freeBalance}, ${account.lockedBalance}, ${account.availableBalance}, ${account.reservedBalance}, ${account.votingBalance}, ${account.vestedBalance}, '${account.identity}', ${account.nonce}, ${account.evmNonce}, '${account.timestamp}')`;

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

  async use(address: string, active = true) {
    // If account does not exist, we extract his info and store it
    if (!this.accounts[address]) {
      this.accounts[address] = await this.accountInfo(address);
    }

    this.accounts[address].active = active;
    return this.accounts[address];
  }

  async useEvm(evmAddress: string): Promise<string> {
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
    const acc = usedAccounts.map(account2Insert).join(',\n\t');
    const statement = INSERT_ACCOUTNS_STATEMENT.replace('<VALUES>', acc);
    await queryv2(statement);

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
