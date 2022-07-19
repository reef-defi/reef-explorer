import { Contract } from "../../../crawler/types";
import { insertContract } from "../../../queries/evmEvent";
import { nodeProvider } from "../../../utils/connector";
import logger from "../../../utils/logger";
import AccountManager from "../../managers/AccountManager";
import DefaultEvent from "./DefaultEvent";

class ContractCreateEvent extends DefaultEvent {
  contract: Contract | undefined;

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

    const address = this.head.event.event.data[0].toString();
    const contractData = (await nodeProvider.query((provider) => provider.api.query.evm.accounts(address))).toJSON();

    throw new Error('Extract contract hash form above data');
    const contractHash = ""; // TODO extract from contractData['contractInfo']
    const bytecode = (await nodeProvider.query((provider) => provider.api.query.evm.codes())).toString();
    const signer = ""; // TODO 
    const gasLimit = "" // TODO
    const storageLimit = "" // TODO
    // const reserveEvent = this.head.events.find((evn) => nodeProvider.getProvider().api.events.balances.Reserved.is(evn.event))!;
    // const signer = reserveEvent.event.data[0].toString();
    // const bytecode = args[0].toString();
    // const gasLimit = args[2].toString();
    // const storageLimit = args[3].toString();

    const { context: bytecodeContext, args: bytecodeArguments } = this.preprocessBytecode(bytecode);
    
    // this.contract = {
    //   signer,
    //   address,
    //   bytecode,
    //   gasLimit,
    //   storageLimit,
    //   bytecodeContext,
    //   bytecodeArguments,
    //   extrinsicId: this.id,
    //   timestamp: this.head.timestamp,
    // }

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

export default ContractCreateEvent;