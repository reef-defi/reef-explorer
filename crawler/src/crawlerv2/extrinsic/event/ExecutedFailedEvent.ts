import { utils } from 'ethers';
import { insertEvmEventFailure } from '../../../queries/evmEvent';
import logger from '../../../utils/logger';
import { toChecksumAddress } from '../../../utils/utils';
import AccountManager from '../../managers/AccountManager';
import { CompleteEvmData, ExtrinsicData } from '../../types';
import DefaultEvent from './DefaultEvent';

class ExecutedFailedEvent extends DefaultEvent {
  data: CompleteEvmData | undefined;

  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);

    const eventData = (this.head.event.event.data.toJSON() as any[]);

    const address = toChecksumAddress(
      eventData.length > 3 ? eventData[1] : eventData[0].address
    );

    const message = utils.toUtf8String(`0x${eventData[eventData.length-2].substr(138)}`.replace(/0+$/, ''));

    this.data = {
      raw: { address, topics: [], data: eventData[2] }, parsed: { message },
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
    await insertEvmEventFailure([{
      ...this.data,
      method: 'ExecutedFailed',
      type: 'Verified',
      eventId: this.id,
      status: 'Error',
      blockId: this.head.blockId,
      eventIndex: this.head.index,
      extrinsicIndex: extrinsicData.index,
    }]);
  }
}

export default ExecutedFailedEvent;
