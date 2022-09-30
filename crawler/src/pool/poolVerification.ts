import { queryv2 } from "../utils/connector";

import {
  Fragment,
  JsonFragment,
  FunctionFragment,
  EventFragment,
  ConstructorFragment,
} from '@ethersproject/abi';
import ReefswapPairAbi from "../assets/ReefswapPairAbi";
import ReefswapV2PairSource from "../assets/ReefswapV2PairSource";

type ABIFragment =
  | Fragment
  | JsonFragment
  | FunctionFragment
  | EventFragment
  | ConstructorFragment;
type ABI = ReadonlyArray<ABIFragment>;

interface UpdateContract {
  name: "ReefswapV2Pair";
  target: "london";
  source: string;
  address: string;
  license?: "MIT";
  optimization: true;
  abi: { [filename: string]: ABI };
  runs: 999999;
  args: "[]";
  filename: "ReefswapV2Pair.sol";
  compilerVersion: "v0.5.16+commit.9c3226ce";
  type: "other";
  data: {};
}

const getPoolContract = (address: string): UpdateContract => ({
  name: "ReefswapV2Pair",
  target: "london",
  source: ReefswapV2PairSource,
  address,
  license: "MIT",
  optimization: true,
  abi: ReefswapPairAbi as any,
  runs: 999999,
  args: "[]",
  filename: "ReefswapV2Pair.sol",
  compilerVersion: "v0.5.16+commit.9c3226ce",
  type: "other",
  data: {},
});

const INSERT_VERIFIED_CONTRACT = `INSERT INTO verified_contract
  (address, name, filename, source,  optimization, compiler_version, compiled_data,  args, runs, target, type, contract_data)
VALUES 
  ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
ON CONFLICT DO NOTHING;`;
  
  export const insertVerifiedContract = async (data: UpdateContract) => {
    const {
      name,
      target,
      source,
      address,
      optimization,
      abi,
      runs,
      args,
      filename,
      compilerVersion,
      type,
      data: contractData,
    } = data;
    const abiString = JSON.stringify(abi);
    await queryv2(INSERT_VERIFIED_CONTRACT, [
      address,
      name,
      filename,
      source,
      optimization,
      compilerVersion,
      abiString,
      args,
      runs,
      target,
      type,
      contractData,
    ]);
  };
  
const findPoolsToVerify = async (): Promise<string[]> => 
  queryv2<{address: string}>('SELECT address FROM pool;')
    .then((res) => res.map((r) => r.address));

export const verifyPools = async () => {
  const pools = await findPoolsToVerify();
  for (const pool of pools) {
    const contract = getPoolContract(pool);
    await insertVerifiedContract(contract);
  }
};

export const verifyPool = async (address: string) => {
  const contract = getPoolContract(address);
  await insertVerifiedContract(contract);
};