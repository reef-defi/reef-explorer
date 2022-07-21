import { insertV2, nodeProvider } from "../../../utils/connector";
import logger from "../../../utils/logger";
import { ensure } from "../../../utils/utils";
import AccountManager from "../../managers/AccountManager";
import { ExtrinsicData } from "../../types";
import DefaultEvent from "./DefaultEvent";

interface Bytecode {
  bytecode: string;
  args: string;
  context: string;
}

class ContractCreateEvent extends DefaultEvent {
  address?: string;
  maintainer?: string;
  bytecode?: Bytecode

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

    // V9
    const [, address] = this.head.event.event.data;
    // V8
    // const [address] = this.head.event.event.data;

    this.address = address.toString()
    logger.info(`New contract created: \n\t -${this.address}`)
    
    const contractData: any = (await nodeProvider.query((provider) => provider.api.query.evm.accounts(this.address))).toJSON();
    const codeHash: string = contractData['contractInfo']['codeHash'];
    this.maintainer = await accountsManager.useEvm(contractData['contractInfo']['maintainer']);
    const bytecode = (await nodeProvider.query((provider) => provider.api.query.evm.codes(codeHash))).toString();
    const { context, args } = this.preprocessBytecode(bytecode);
    this.bytecode = { bytecode, context, args }
  }

  async save(extrinsicData: ExtrinsicData): Promise<void> {
    await super.save(extrinsicData);

    ensure(!!this.address, 'Contract address was unclaimed. Call process function before save')
    ensure(!!this.bytecode, 'Contract bytecode was unclaimed. Call process function before save')
    ensure(!!this.maintainer, 'Contract maintainer was unclaimed. Call process function before save')
    // ensure(!!this.limits, 'Contract limits was unclaimed. Call process function before save')
    
    const gasLimit = extrinsicData.args[2].toString();
    const storageLimit = extrinsicData.args[3].toString();
    logger.info('Inserting contract');

    await insertV2(`
    INSERT INTO contract
      (address, extrinsic_id, signer, bytecode, bytecode_context, bytecode_arguments, gas_limit, storage_limit, timestamp)
    VALUES
      %L
    ON CONFLICT (address) DO NOTHING;`,
        [[this.address, extrinsicData.id, this.maintainer, this.bytecode?.bytecode, this.bytecode?.context, this.bytecode?.args, gasLimit, storageLimit, this.head.timestamp]]
    )
  }

}

export default ContractCreateEvent;