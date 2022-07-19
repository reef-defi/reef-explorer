import { ExtrinsicHead } from "../../crawler/types";
import { queryv2 } from "../../utils/connector";
import { ProcessModule } from "../types";
import Extrinsic from "./Extrinsic";

// TODO Get get next ProcessModule id
const nextExtrinsicId = async (): Promise<number> => (await queryv2<number>('SELECT id FROM extrinsic ORDER BY id DESC LIMIT 1'))[0] + 1;

const resolveExtrinsic = async (
  head: ExtrinsicHead,
): Promise<ProcessModule> => {
  const id = await nextExtrinsicId();
  console.log(id)
  const extrinsic = new Extrinsic(id, head);
  return extrinsic;
};

export default resolveExtrinsic;
