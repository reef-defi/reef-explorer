import AccountManager from '../../managers/AccountManager';
import DefaultEvent from './DefaultEvent';

class SignerAddressCapture extends DefaultEvent {
  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);
    const address = this.head.event.event.data[0].toString();
    await accountsManager.use(address);
  }
}

export default SignerAddressCapture;
