import AccountManager from "../AccountManager";
import { ProcessModule } from "../types";
import NativeExtrinsic from "./NativeExtrinsic";


class EvmAccountsExtrinsic extends NativeExtrinsic implements ProcessModule {
  async process(accountsManager: AccountManager): Promise<void> {
    super.process(accountsManager);
  }
  async save(): Promise<void> {
    super.save();
  }

}

export default EvmAccountsExtrinsic;