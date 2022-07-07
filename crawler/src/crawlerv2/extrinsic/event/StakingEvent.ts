import { insertV2, nodeProvider } from "../../../utils/connector";
import logger from "../../../utils/logger";
import AccountManager from "../../managers/AccountManager";
import TokenHolderEvent from "./TokenHolderEvent";

class StakingEvent extends TokenHolderEvent {
  signer: string = "";
  amount: string = "0";

  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);
    
    this.signer = this.head.event.event.data[0].toString();
    this.amount = this.head.event.event.data[1].toString();

    // Marking controller account
    this.useNativeAccount(this.signer, accountsManager);

    // Retrieving block hash to extract correct reward destination mapping
    const blockHash = await nodeProvider.query(
      (provider) => provider.api.rpc.chain.getBlockHash(this.head.blockId),
    );
    // Retrieving reward destination mapping for specific block and user
    const rewardDestination = await nodeProvider.query(
      (provider) => provider.api.query.staking.payee.at(blockHash, this.signer),
    );

    // If account has speficied different reward destination we switch the staking signer to that one
    if (rewardDestination.isAccount) {
      logger.info(`Redirecting staking rewards from: ${this.signer} to: ${rewardDestination.asAccount.toString()}`);
      this.signer = rewardDestination.asAccount.toString();

      // Marking destination account
      this.useNativeAccount(this.signer, accountsManager);
    }
  }

  async save(): Promise<void> {
    // Saving default event
    await super.save();

    // Saving processed staking
    logger.info('Inserting staking event');
    await insertV2(
      `INSERT INTO staking
        (event_id, signer, amount, type, timestamp)
      VALUES
        %L;`,
      [(this.id, this.signer, this.amount, 'Reward', this.head.timestamp)],
    );
  }
}

export default StakingEvent;