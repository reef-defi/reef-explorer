import { insertEvent } from "../../../queries/event";
import { queryv2 } from "../../../utils/connector";
import logger from "../../../utils/logger";
import AccountManager from "../../managers/AccountManager";
import { EventData, ExtrinsicData } from "../../types";

class DefaultEvent {
  id: number|undefined;
  head: EventData;
  signedData: any|undefined;

  constructor(head: EventData) {
    this.head = head;
  }

  async process(accountsManager: AccountManager): Promise<void> {
    const result = await queryv2<{nextval: string}>('SELECT nextval(\'event_sequence\');');
    this.id = parseInt(result[0].nextval);
  }

  async save(extrinsicData: ExtrinsicData): Promise<void> {
    if (!this.id) {
      throw new Error('Event id is not claimed!');
    }
    logger.info(`Inserting ${this.id} event`);

    await insertEvent({
      id: this.id,
      index: this.head.index,
      event: this.head.event,
      blockId: this.head.blockId,
      timestamp: this.head.timestamp,
      status: extrinsicData.status,
      extrinsicId: extrinsicData.id,
      extrinsicIndex: extrinsicData.index,
    })
  }
}

export default DefaultEvent;