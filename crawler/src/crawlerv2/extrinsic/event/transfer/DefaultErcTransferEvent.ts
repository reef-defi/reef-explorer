import { BigNumber } from "ethers";
import { Transfer } from "../../../../crawler/types";
import { findNativeAddress } from "../../../../crawler/utils";
import { insertTransfers } from "../../../../queries/extrinsic";
import logger from "../../../../utils/logger";
import AccountManager from "../../../managers/AccountManager";
import EvmLogEvent from "../EvmLogEvent";

class DefaultErcTransferEvent extends EvmLogEvent {
  transfers: Transfer[] = [];

  async evmLogToTransfer (fromEvmAddress: string, toEvmAddress: string, accountManager: AccountManager): Promise<Transfer> {
    const [toAddress, fromAddress] = await Promise.all([
      findNativeAddress(toEvmAddress),
      findNativeAddress(fromEvmAddress),
    ]);

    // Marking used accounts
    await accountManager.use(toAddress);
    await accountManager.use(fromAddress);

    const tokenAddress = this.data?.raw.address;
    // TODO remove below statement when everything is tested
    if (!tokenAddress) {
      throw new Error('Token address is undefiend')
    }

    // Default return
    return {
      blockId: this.head.blockId,
      timestamp: this.head.timestamp,
      extrinsicId: this.head.extrinsicId,
      toEvmAddress,
      success: true,
      fromEvmAddress,
      errorMessage: '',
      tokenAddress,
      toAddress: toAddress === '' ? 'null' : toAddress,
      fromAddress: fromAddress === '' ? 'null' : fromAddress,
      feeAmount: '', // TODO signed data: BigNumber.from(this.head.signedData?.fee.partialFee).toString()
      amount: '0',
      type: 'ERC20',
    };
  };

  async save(): Promise<void> {
    await super.save();
    
    logger.info('Inserting Erc transfers');
    await insertTransfers(this.transfers);
  }
};

export default DefaultErcTransferEvent;