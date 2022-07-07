import AccountManager from "../../AccountManager";
import { ProcessModule } from "../../types";
import DefaultEvent from "./DefaultEvent";

class KillAccountEvent extends DefaultEvent implements ProcessModule {
  async process(accountsManager: AccountManager): Promise<void> {
    // Process default event
    await super.process(accountsManager);
    const address = this.head.event.event.data[0].toString();
    // Kill account
    await accountsManager.use(address, false);
  }
}

export default KillAccountEvent;