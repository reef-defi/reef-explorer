import { utils } from "ethers";
import { BytecodeLog, VerifiedContract } from "../../../crawler/types";
import { toChecksumAddress } from "../../../utils/utils";
import AccountManager from "../../managers/AccountManager";
import { EventData } from "../../types";
import UnverifiedEvmLog from "./UnverifiedEvmLog";


class EvmLogEvent extends UnverifiedEvmLog {
  contract: VerifiedContract;
  constructor(head: EventData, contract: VerifiedContract) {
    super(head);
    this.contract = contract;
  }

  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);

    const eventData = (this.head.event.event.data.toJSON() as any);
    const { topics, data } : BytecodeLog = eventData[0];
    let { address } : BytecodeLog = eventData[0];
    address = toChecksumAddress(address);

    this.data = {
      raw: { address, topics, data }, parsed: {}, status: 'Success', type: 'Unverified',
    };
    const {compiled_data, name} = this.contract;
    const iface = new utils.Interface(compiled_data[name]);
    this.data.parsed = iface.parseLog({ topics, data });
    this.data.type = 'Verified';
  }

};

export default EvmLogEvent;