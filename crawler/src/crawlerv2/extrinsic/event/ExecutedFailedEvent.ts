import { utils } from 'ethers';
import { insertEvmEventFailure } from '../../../queries/evmEvent';
import logger from '../../../utils/logger';
import { toChecksumAddress } from '../../../utils/utils';
import AccountManager from '../../managers/AccountManager';
import { CompleteEvmData, ExtrinsicData } from '../../types';
import DefaultEvent from './DefaultEvent';

class ExecutedFailedEvent extends DefaultEvent {
  data: CompleteEvmData | undefined;

  static hexToAscii(str1: string): string {
    const hex = str1.toString();
    let str = '';
    for (let n = 0; n < hex.length; n += 2) {
      str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
  }

  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);

    const eventData = (this.head.event.event.data.toJSON() as any[]);

    const address = toChecksumAddress(
        // TODO check if eventData[0].address exists in ANY block otherwise remove
      eventData.length > 3 ? eventData[1] : eventData[0].address || eventData[0],
    );
    // TODO check if eventData[eventData.length - 2] is string in ANY block otherwise remove and use just ...-1
    let eventDataHex = eventData[eventData.length - 2];
    if(!(typeof eventDataHex === 'string')){
      eventDataHex =  eventData[eventData.length - 1]
    }
    const message: string = ExecutedFailedEvent.hexToAscii(eventDataHex.substr(138));

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
