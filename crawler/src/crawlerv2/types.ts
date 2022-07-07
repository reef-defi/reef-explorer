import AccountManager from "./managers/AccountManager";

export interface ProcessModule {
  process(accountsManager: AccountManager): Promise<void>;
  save(): Promise<void>;
}