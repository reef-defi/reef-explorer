import { BigNumber } from 'ethers';
import { TokenHolder } from '../../../../crawler/types';
import { insertTransfers } from '../../../../queries/extrinsic';
import logger from '../../../../utils/logger';
import { ExtrinsicData, Transfer } from '../../../types';
import EvmLogEvent from '../EvmLogEvent';
import { ZERO_ADDRESS } from './utils';

class DefaultErcTransferEvent extends EvmLogEvent {
  transfers: Transfer[] = [];

  accountTokenHolders: TokenHolder[] = [];

  contractTokenHolders: TokenHolder[] = [];

  addTokenHolder(
    address: string,
    evmAddress: string,
    balance: string,
    nftId:string|null = null,
  ) {
    if (address === '0x' || address === ZERO_ADDRESS) { return; }

    // Creating new token holder
    const tokenHolder: TokenHolder = {
      nftId,
      balance,
      evmAddress: address === '' ? evmAddress : '',
      timestamp: this.head.timestamp,
      info: this.contract.contract_data,
      tokenAddress: this.contract.address,
      type: address === '' ? 'Contract' : 'Account',
      signerAddress: address,
    };

    // Based on reciever type (contract/account) we extend holder accordingly
    if (tokenHolder.type === 'Account') {
      this.accountTokenHolders.push(tokenHolder);
    } else {
      this.contractTokenHolders.push(tokenHolder);
    }
  }

  async save(extrinsicData: ExtrinsicData): Promise<void> {
    await super.save(extrinsicData);

    logger.info('Inserting Erc transfers');
    await insertTransfers(this.transfers.map((transfer) => ({
      ...transfer,
      success: true,
      errorMessage: '',
      extrinsicId: extrinsicData.id,
      feeAmount: BigNumber.from(extrinsicData.signedData!.fee.partialFee).toString(),
    })));
  }
}

export default DefaultErcTransferEvent;
