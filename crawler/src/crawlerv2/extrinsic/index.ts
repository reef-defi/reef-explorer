import { ExtrinsicHead } from "../../crawler/types";
import AccountManager from "../managers/AccountManager";
import { ProcessModule } from "../types";
import Extrinsic from "./NativeExtrinsic";

// TODO Get get next ProcessModule id
const nextExtrinsicId = async (): Promise<number> => 10;

const resolveExtrinsic = async (
  head: ExtrinsicHead,
  accounts: AccountManager
): Promise<ProcessModule> => {
  const id = await nextExtrinsicId();
  const extrinsic = new Extrinsic(id, head);

  // TODO maybe place process outside of resolve?
  await extrinsic.process(accounts);
  return extrinsic;
};

export default resolveExtrinsic;
