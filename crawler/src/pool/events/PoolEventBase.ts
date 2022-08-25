import { utils } from "ethers";

class PoolEventBase <T>{
  evmEventId: string;

  constructor(eventId: string) {
    this.evmEventId = eventId;
  }

  async process(event: T): Promise<void> { }
  async save(): Promise<void> { }
  async combine(event: T): Promise<void> {
    await this.process(event);
    await this.save();
  }
}

export default PoolEventBase;