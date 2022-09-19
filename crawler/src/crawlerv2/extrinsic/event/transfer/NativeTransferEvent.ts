import { BigNumber } from 'ethers';
import { insertTransfers } from '../../../../queries/extrinsic';
import { nodeProvider } from '../../../../utils/connector';
import logger from '../../../../utils/logger';
import { REEF_CONTRACT_ADDRESS } from '../../../../utils/utils';
import AccountManager from '../../../managers/AccountManager';
import { ExtrinsicData } from '../../../types';
import DefaultEvent from '../DefaultEvent';

class NativeTransferEvent extends DefaultEvent {
  to: string = '';

  from: string = '';

  toEvm: string = '';

  fromEvm: string = '';

  amount: string = '';

  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);

    const [fromAddress, toAddress, amount] = this.head.event.event.data;
    const [toEvmAddress, fromEvmAddress] = await Promise.all([
      nodeProvider.query((provider) => provider.api.query.evmAccounts.evmAddresses(toAddress)),
      nodeProvider.query((provider) => provider.api.query.evmAccounts.evmAddresses(fromAddress)),
    ]);

    this.amount = amount.toString();

    this.to = toAddress.toString();
    this.from = fromAddress.toString();
    this.toEvm = toEvmAddress.toString();
    this.fromEvm = fromEvmAddress.toString();

    logger.info(`Processing native transfer from ${fromAddress} to ${toAddress} -> ${this.amount} REEF`);
    await accountsManager.use(this.to);
    await accountsManager.use(this.from);
  }

  async save(extrinsicData: ExtrinsicData): Promise<void> {
    await super.save(extrinsicData);

    if (!this.id) {
      throw new Error('Event id is not set');
    }
    
    logger.info('Inserting transfer');
    await insertTransfers([{
      eventId: this.id,
      denom: 'REEF',
      type: 'Native',
      amount: this.amount,
      toAddress: this.to,
      fromAddress: this.from,
      toEvmAddress: this.toEvm,
      blockId: this.head.blockId,
      fromEvmAddress: this.fromEvm,
      timestamp: this.head.timestamp,
      extrinsicId: extrinsicData.id,
      tokenAddress: REEF_CONTRACT_ADDRESS,
      success: extrinsicData.status.type === 'success',
      feeAmount: BigNumber.from(extrinsicData.signedData!.fee.partialFee).toString(),
      errorMessage: extrinsicData.status.type === 'error' ? extrinsicData.status.message : '',
    }]);
  }
}

export default NativeTransferEvent;
