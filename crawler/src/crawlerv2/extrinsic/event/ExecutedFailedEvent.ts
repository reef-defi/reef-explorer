import AccountManager from "../../managers/AccountManager";
import DefaultEvent from "./DefaultEvent";

class ExecutedFailedEvent extends DefaultEvent {
  async process(accountsManager: AccountManager): Promise<void> {
    throw new Error('Unverified ')
  }
}

export default ExecutedFailedEvent