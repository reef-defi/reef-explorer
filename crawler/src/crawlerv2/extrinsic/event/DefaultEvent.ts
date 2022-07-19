import { EventHead } from "../../../crawler/types";
import { insertEvent } from "../../../queries/event";
import { queryv2 } from "../../../utils/connector";
import AccountManager from "../../managers/AccountManager";
import { ProcessModule } from "../../types";

class DefaultEvent implements ProcessModule {
  id: number|undefined;
  head: EventHead;
  signedData: any|undefined;
  constructor(head: EventHead) {
    this.head = head;
  }

  async init(): Promise<void> {}
  async process(accountsManager: AccountManager): Promise<void> {
    const result = await queryv2<number>('SELECT id FROM event ORDER BY id DESC LIMIT 1');
    console.log('Event id result: ', result);
    this.id = result[0];
  }

  async save(): Promise<void> {
    if (!this.id) {
      throw new Error('Event id is not claimed!');
    }
    await insertEvent({
      id: this.id,
      index: this.head.index,
      event: this.head.event,
      status: this.head.status,
      blockId: this.head.blockId,
      timestamp: this.head.timestamp,
      // signedData: this.head.signedData,
      extrinsicId: this.head.extrinsicId,
      extrinsicIndex: this.head.extrinsicIndex,
    })
  }
}

export default DefaultEvent;