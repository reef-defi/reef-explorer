import { EventHead } from "../../../../crawler/types";
import AccountManager from "../../../managers/AccountManager";
import EvmLogEvent from "../EvmLogEvent";

class Erc20TransferEvent extends EvmLogEvent {
  // async process(accountsManager: AccountManager): Promise<void> {
  //   await super.process(accountsManager);
  // }
};

export default Erc20TransferEvent;