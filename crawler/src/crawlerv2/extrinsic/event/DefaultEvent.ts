import { insertEvent } from '../../../queries/event';
import { queryv2 } from '../../../utils/connector';
import logger from '../../../utils/logger';
import AccountManager from '../../managers/AccountManager';
import { EventData, ExtrinsicData } from '../../types';

class DefaultEvent {
  id: number|undefined;

  head: EventData;

  signedData: any|undefined;

  constructor(head: EventData) {
    this.head = head;
  }

  private static async nextId(): Promise<number> {
    const result = await queryv2<{nextval: string}>('SELECT nextval(\'event_sequence\');');
    return parseInt(result[0].nextval, 10);
  }

  private static async idExists(id: number): Promise<boolean> {
    const exist = await queryv2<{id: string}>('SELECT id FROM event WHERE id = $1', [id]);
    return exist.length > 0;
  }

  private static async getId(): Promise<number> {
    let id = await DefaultEvent.nextId();
    while (await DefaultEvent.idExists(id)) {
      id = await DefaultEvent.nextId();
    }
    return id;
  }

  async process(accountsManager: AccountManager): Promise<void> {
    this.id = await DefaultEvent.getId();
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
    });
  }
}

export default DefaultEvent;
