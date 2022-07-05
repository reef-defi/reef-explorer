import { ExtrinsicHead } from "../../crawler/types";
import AccountManager from "../AccountManager";
import { ProcessModule } from "../types";
import EvmAccountsExtrinsic from "./EvmAccountsExtrinsic";
import EvmExtrinsic from "./EvmExtrinsic";
import NativeExtrinsic from "./NativeExtrinsic";



const selectExtrinsic = (id: number, head: ExtrinsicHead): ProcessModule => {
  switch(head.extrinsic.method.section) {
    case 'evm': return new EvmExtrinsic(id, head);
    case 'evmAccounts': return new EvmAccountsExtrinsic(id, head);
    default: return new NativeExtrinsic(id, head);
  }
}

// TODO Get get next ProcessModule id
const nextExtrinsicId = async (): Promise<number> => 10;

const resolveExtrinsic = async (
  head: ExtrinsicHead,
  accounts: AccountManager
): Promise<ProcessModule> => {
  const id = await nextExtrinsicId();
  const extrinsic = selectExtrinsic(id, head);
  await extrinsic.process(accounts);
  return extrinsic;
};

export default resolveExtrinsic;
