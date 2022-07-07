import { EvmLogWithDecodedEvent, Transfer } from "../../../../crawler/types";
import { findNativeAddress } from "../../../../crawler/utils";
import { insertTransfers } from "../../../../queries/extrinsic";
import logger from "../../../../utils/logger";
import EvmLogEvent from "../EvmLogEvent";
import { BigNumber } from "ethers";

class DefaultErcTransferEvent extends EvmLogEvent {
  transfers: Transfer[] = [];

  async evmLogToTransfer (fromEvmAddress: string, toEvmAddress: string): Promise<Transfer> {
    const [toAddress, fromAddress] = await Promise.all([
      findNativeAddress(toEvmAddress),
      findNativeAddress(fromEvmAddress),
    ]);

    const tokenAddress = this.data?.raw.address;
    if (!tokenAddress) {
      throw new Error('Token address is undefiend')
    }
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
      feeAmount: BigNumber.from(this.head.signedData?.fee.partialFee).toString(),
      amount: '0',
      type: 'ERC20',
    };
  };

  async save(): Promise<void> {
    await super.save();
    
    logger.info('Inserting Erc20 transfer');
    await insertTransfers(this.transfers);
  }
};

export default DefaultErcTransferEvent;