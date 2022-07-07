import { ExtrinsicHead, SignedExtrinsicData } from "../../crawler/types";
import { insertExtrinsic } from "../../queries/extrinsic";
import { nodeProvider } from "../../utils/connector";
import logger from "../../utils/logger";
import AccountManager from "../managers/AccountManager";
import resolveEvent from "./event";
import { ProcessModule } from "../types";


class NativeExtrinsic implements ProcessModule {
  id: number;
  head: ExtrinsicHead;
  events: ProcessModule[] = [];
  signedData: undefined|SignedExtrinsicData;

  constructor(id: number, head: ExtrinsicHead) {
    this.id = id;
    this.head = head;
  }
  async process(accountsManager: AccountManager): Promise<void> {
    // Extracting signed data
    this.signedData = this.head.extrinsic.isSigned
      ? await this.getSignedData(this.head.extrinsic.toHex())
      : undefined;

    for (let index = 0; index < this.head.events.length; index += 1) {
      const event = await resolveEvent({
          index,
          extrinsicId: this.id,
          status: this.head.status,
          blockId: this.head.blockId,
          event: this.head.events[index],
          timestamp: this.head.timestamp,
          extrinsicIndex: this.head.index,
          signedData: this.signedData,
        }, 
        accountsManager
      );
      this.events.push(event);
    }
  }
  async save(): Promise<void> {
    logger.info('Inserting extrinsic');
    await insertExtrinsic({
      id: this.id,
      index: this.head.index,
      blockId: this.head.blockId,
      signedData: this.signedData,
      timestamp: this.head.timestamp,
      status: this.head.status.type,
      hash: this.head.extrinsic.hash.toString(),
      method: this.head.extrinsic.method.method,
      section: this.head.extrinsic.method.section,
      args: JSON.stringify(this.head.extrinsic.args),
      docs: this.head.extrinsic.meta.docs.toLocaleString(),
      signed: this.head.extrinsic.signer?.toString() || 'deleted',
      errorMessage: this.head.status.type === 'error' ? this.head.status.message : '',
    });
    for (let event of this.events) {
      await event.save();
    }
  }

  private async getSignedData(hash: string): Promise<SignedExtrinsicData> {
    const [fee, feeDetails] = await Promise.all([
      nodeProvider.query((provider) => provider.api.rpc.payment.queryInfo(hash)),
      nodeProvider.query((provider) => provider.api.rpc.payment.queryFeeDetails(hash)),
    ]);
  
    return {
      fee: fee.toJSON(),
      feeDetails: feeDetails.toJSON(),
    };
  }
}

export default NativeExtrinsic;