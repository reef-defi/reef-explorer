import AccountManager from "./managers/AccountManager";

export interface ProcessModule {
  init(): Promise<void>
  process(accountsManager: AccountManager): Promise<void>;
  save(): Promise<void>;
}