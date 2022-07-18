import { Event } from "../../crawler/types";
import { insertContract } from "../../queries/evmEvent";
import { nodeProvider } from "../../utils/connector";
import logger from "../../utils/logger";
import { toChecksumAddress } from "../../utils/utils";
import AccountManager from "../managers/AccountManager";
import Extrinsic from "./NativeExtrinsic";
import {Contract} from "./../../crawler/types"

class CreateContractExtrinsic extends Extrinsic {
  contract: Contract | undefined;

  private findContractEvent(events: Event[]): Event | undefined {
    return events.find(
      ({ event }) => event.section === 'evm' && event.method === 'Created',
    );
  }
  
  private preprocessBytecode(bytecode: string) {
    const start = bytecode.indexOf('6080604052');
    const end = bytecode.indexOf('a265627a7a72315820') !== -1
      ? bytecode.indexOf('a265627a7a72315820')
      : bytecode.indexOf('a264697066735822');
    return {
      context: bytecode.slice(start, end),
      args: bytecode.slice(end),
    };
  };

  async process(accountsManager: AccountManager): Promise<void> {
    await super.process(accountsManager);

    const { args } = this.head.extrinsic;
    const contractEvent = this.findContractEvent(this.head.events)!;
    const address = toChecksumAddress(contractEvent.event.data[0].toString());
    
    const reserveEvent = this.head.events.find((evn) => nodeProvider.getProvider().api.events.balances.Reserved.is(evn.event))!;
    const signer = reserveEvent.event.data[0].toString();
    const bytecode = args[0].toString();
    const gasLimit = args[2].toString();
    const storageLimit = args[3].toString();

    const { context: bytecodeContext, args: bytecodeArguments } = this.preprocessBytecode(bytecode);
    
    this.contract = {
      signer,
      address,
      bytecode,
      gasLimit,
      storageLimit,
      bytecodeContext,
      bytecodeArguments,
      extrinsicId: this.id,
      timestamp: this.head.timestamp,
    }

    // Marking account update
    await accountsManager.use(signer);
  }

  async save(): Promise<void> {
    await super.save();

    if (!this.contract) {
      throw new Error('Contract is undefined, call .process() method to prepare required data!');
    }
    logger.info('Inserting contract');
    await insertContract(this.contract);
  }
}

export default CreateContractExtrinsic;