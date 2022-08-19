import { BytecodeLog } from '../../../crawler/types';
import { insertEvmLog } from '../../../queries/evmEvent';
import logger from '../../../utils/logger';
import { toChecksumAddress } from '../../../utils/utils';
import AccountManager from '../../managers/AccountManager';
import { CompleteEvmData, ExtrinsicData } from '../../types';
import DefaultEvent from './DefaultEvent';

class UnverifiedEvmLog extends DefaultEvent {
  type: 'Unverified' | 'Verified' = 'Unverified';

  data: CompleteEvmData | undefined;

  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);

    const eventData = (this.head.event.event.data.toJSON() as any);
    const { topics, data } : BytecodeLog = eventData[0];
    let { address } : BytecodeLog = eventData[0];
    address = toChecksumAddress(address);

    this.data = {
      raw: { address, topics, data }, parsed: null,
    };
  }

  async save(extrinsicData: ExtrinsicData): Promise<void> {
    await super.save(extrinsicData);
    if (!this.id) {
      throw new Error('Id is not claimed');
    }
    if (!this.data) {
      throw new Error('Evm log data is not defined, call process function before saving!');
    }

    logger.info('Inserting evm log');
    await insertEvmLog([{
      ...this.data,
      method: 'Log',
      type: this.type,
      eventId: this.id,
      status: 'Success',
      blockId: this.head.blockId,
      eventIndex: this.head.index,
      extrinsicIndex: extrinsicData.index,
    }]);
  }
}

export default UnverifiedEvmLog;
