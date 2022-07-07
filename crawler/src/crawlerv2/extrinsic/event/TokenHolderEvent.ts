import { AccountBody, TokenHolder } from "../../../crawler/types"
import { REEF_CONTRACT_ADDRESS, REEF_DEFAULT_DATA } from "../../../utils/utils";
import AccountManager from "../../managers/AccountManager";
import DefaultEvent from "./DefaultEvent"
import insertTokenHolders from "./../../../queries/tokenHoldes";
import logger from "../../../utils/logger";

class TokenHolderEvent extends DefaultEvent {
  tokenHolders: TokenHolder[] = [];

  private accountToTokenHolder(account: AccountBody): TokenHolder {
    return {
      timestamp: account.timestamp,
      signerAddress: account.address,
      tokenAddress: REEF_CONTRACT_ADDRESS,
      info: { ...REEF_DEFAULT_DATA },
      balance: account.freeBalance,
      type: 'Account',
      evmAddress: '',
      nftId: null,
    }
  }

  async useNativeAccount(address: string, accountsManager: AccountManager) {
    const account = await accountsManager.use(address);
    const tokenHolder = this.accountToTokenHolder(account);
    this.tokenHolders.push(tokenHolder);
  };

  async save(): Promise<void> {
    await super.save();
    logger.info('Updating token holders');
    await insertTokenHolders(this.tokenHolders);
  }
};

export default TokenHolderEvent;