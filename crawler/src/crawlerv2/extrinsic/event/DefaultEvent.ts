import { EventHead } from "../../../crawler/types";
import { insertEvent } from "../../../queries/event";
import { queryv2 } from "../../../utils/connector";
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
    const result = await queryv2<number>('SELECT id FROM event ORDER BY id DESC LIMIT 1');
    console.log('Event id result: ', result);
    this.id = result[0];
  }

  async save(extrinsicData: ExtrinsicData): Promise<void> {
    if (!this.id) {
      throw new Error('Event id is not claimed!');
    }
    await insertEvent({
      id: this.id,
      index: this.head.index,
      event: this.head.event,
      blockId: this.head.blockId,
      timestamp: this.head.timestamp,
      status: extrinsicData.status,
      extrinsicId: extrinsicData.id,
      extrinsicIndex: extrinsicData.index,
      signedData: extrinsicData.signedData,
    })
  }
}

export default DefaultEvent;