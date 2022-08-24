import DefaultPoolEvent, { ProcessPairEvent } from "./DefaultPoolEvent";


class SyncEvent extends DefaultPoolEvent {
  constructor(poolId: string, eventId: string, timestamp: string) {
    super(poolId, eventId, timestamp, 'Sync');
  }

  async process(event: ProcessPairEvent): Promise<void> {
    await super.process(event);

    this.reserved_1 = event.data.args[0].toString();
    this.reserved_2 = event.data.args[1].toString();
  }
}

export default SyncEvent;