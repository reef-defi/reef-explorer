import AccountManager from '../../managers/AccountManager';
import DefaultEvent from './DefaultEvent';

class ClaimEvmAccountEvent extends DefaultEvent {
  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);
    const [signer] = this.head.event.event.data;
    await accountsManager.use(signer.toString());
  }
}

export default ClaimEvmAccountEvent;
