import AccountManager from "../managers/AccountManager";
import NativeExtrinsic from "./NativeExtrinsic";

class ClaimEvmAccountExtrinsic extends NativeExtrinsic {
  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);
    const [signer] = this.head.events[0].event.data;
    await accountsManager.use(signer.toString());
  }
}

export default ClaimEvmAccountExtrinsic;