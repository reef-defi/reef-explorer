import { EventHead } from "../../../crawler/types";
import { insertEvent } from "../../../queries/event";
import AccountManager from "../../AccountManager";
import { ProcessModule } from "../../types";

class DefaultEvent implements ProcessModule {
  id: number;
  head: EventHead;
  constructor(id: number, head: EventHead) {
    this.id = id;
    this.head = head;
  }
  async process(accountsManager: AccountManager): Promise<void> { }
  async save(): Promise<void> {
    await insertEvent({
      id: this.id,
      index: this.head.index,
      event: this.head.event,
      status: this.head.status,
      blockId: this.head.blockId,
      timestamp: this.head.timestamp,
      extrinsicId: this.head.extrinsicId,
      extrinsicIndex: this.head.extrinsicIndex,
    })
  }
}

export default DefaultEvent;