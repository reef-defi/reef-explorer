import { BigNumber } from "ethers";
import { TokenHolder } from "../../../crawler/types";
import { insertTransfers } from "../../../queries/extrinsic";
import { nodeProvider } from "../../../utils/connector";
import logger from "../../../utils/logger";
import { REEF_CONTRACT_ADDRESS } from "../../../utils/utils";
import AccountManager from "../../managers/AccountManager";
import TokenHolderEvent from "./TokenHolderEvent";

class NativeTransferEvent extends TokenHolderEvent {
  to: string = "";
  from: string = "";
  toEvm: string = "";
  fromEvm: string = "";
  fee: string = "";
  amount: string = "";
  tokenHolders: TokenHolder[] = [];

  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);

    const [fromAddress, toAddress, amount] = this.head.event.event.data;
    const [toEvmAddress, fromEvmAddress] = await Promise.all([
      nodeProvider.query((provider) => provider.api.query.evmAccounts.evmAddresses(toAddress)),
      nodeProvider.query((provider) => provider.api.query.evmAccounts.evmAddresses(fromAddress)),
    ]);
    const feeAmount = BigNumber.from(this.head.signedData!.fee.partialFee).toString();

    this.amount = amount.toString();
    this.fee = feeAmount.toString();

    this.to = toAddress.toString();
    this.from = fromAddress.toString();
    this.toEvm = toEvmAddress.toString();
    this.fromEvm = fromEvmAddress.toString();

    this.useNativeAccount(this.to, accountsManager);
    this.useNativeAccount(this.from, accountsManager);
  }

  async save(): Promise<void> {
    await super.save();
    
    logger.info('Inserting transfer')
    await insertTransfers([{
      denom: 'REEF',
      type: 'Native',
      amount: this.amount,
      feeAmount: this.fee,
      toAddress: this.to,
      fromAddress: this.from,
      toEvmAddress: this.toEvm,
      blockId: this.head.blockId,
      fromEvmAddress: this.fromEvm,
      timestamp: this.head.timestamp,
      extrinsicId: this.head.extrinsicId,
      tokenAddress: REEF_CONTRACT_ADDRESS,
      success: this.head.status.type === 'success',
      errorMessage: this.head.status.type === 'error' ? this.head.status.message : '',
    }]);
  }
}

export default NativeTransferEvent;