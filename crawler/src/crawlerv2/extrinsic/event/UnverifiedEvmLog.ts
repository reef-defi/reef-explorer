import { BytecodeLog, CompleteEvmData } from "../../../crawler/types";
import { insertEvmLog } from "../../../queries/evmEvent";
import logger from "../../../utils/logger";
import { toChecksumAddress } from "../../../utils/utils";
import AccountManager from "../../managers/AccountManager";
import DefaultEvent from "./DefaultEvent";

class UnverifiedEvmLog extends DefaultEvent {
  data: CompleteEvmData | undefined;

  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);

    const eventData = (this.head.event.event.data.toJSON() as any);
    const { topics, data } : BytecodeLog = eventData[0];
    let { address } : BytecodeLog = eventData[0];
    address = toChecksumAddress(address);

    this.data = {
      raw: { address, topics, data }, parsed: {}, status: 'Success', type: 'Unverified',
    };
  }

  async save(): Promise<void> {
    await super.save();

    if (!this.data) {
      throw new Error('Evm log data is not defined, call process function before saving!');
    }
    
    logger.info('Inserting evm log');
    await insertEvmLog([{...this.data,
      blockId: this.head.blockId,
      eventId: this.id,
      eventIndex: this.head.index,
      extrinsicIndex: this.head.extrinsicIndex,
    }]);
  }
}

export default UnverifiedEvmLog;