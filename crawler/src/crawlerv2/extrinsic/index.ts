import { ExtrinsicHead } from "../../crawler/types";
import AccountManager from "../managers/AccountManager";
import { ProcessModule } from "../types";
import ClaimEvmAccountExtrinsic from "./ClaimEvmAccountExtrinsic";
import CreateContractExtrinsic from "./CreateContractExtrinsic";
import NativeExtrinsic from "./NativeExtrinsic";

const selectExtrinsic = async (id: number, head: ExtrinsicHead): Promise<ProcessModule> => {
  if (head.extrinsic.method.section === 'evm' && head.extrinsic.method.method === 'create')
    return new CreateContractExtrinsic(id, head);
  else if (head.extrinsic.method.section === 'evmAccounts' && head.extrinsic.method.method === 'claimDefaultAccount')
    return new ClaimEvmAccountExtrinsic(id, head);
  else
    return new NativeExtrinsic(id, head);
    
  // It would be amazing if we could use pattern matching 
  // but i do not think it is possible
  // maybe later when everything is clear
  // switch(head.extrinsic.method.section) {
  //   case 'evm': return selectEvmExtrinsic(id, head);
  //   case 'evmAccounts': return selectEvmAccountExtrinsic(id, head);
  //   default: return new NativeExtrinsic(id, head);
  // }
}

// TODO Get get next ProcessModule id
const nextExtrinsicId = async (): Promise<number> => 10;

const resolveExtrinsic = async (
  head: ExtrinsicHead,
  accounts: AccountManager
): Promise<ProcessModule> => {
  const id = await nextExtrinsicId();
  const extrinsic = await selectExtrinsic(id, head);

  // TODO maybe place process outside of resolve?
  await extrinsic.process(accounts);
  return extrinsic;
};

export default resolveExtrinsic;
