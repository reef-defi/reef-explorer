class PoolEventBase <T> {
  evmEventId: string;

  constructor(eventId: string) {
    this.evmEventId = eventId;
  }
  /* eslint-disable */
  async process(event: T): Promise<void> { }

  async save(): Promise<void> { }

  /* eslint-enable */
  async combine(event: T): Promise<void> {
    await this.process(event);
    await this.save();
  }
}

export default PoolEventBase;
