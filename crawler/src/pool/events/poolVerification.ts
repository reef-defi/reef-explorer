import { queryv2 } from '../../utils/connector';

import ReefswapPairAbi from '../../assets/ReefswapPairAbi';
import ReefswapV2PairSource from '../../assets/ReefswapV2PairSource';

const findPoolsToVerify = async (): Promise<string[]> => queryv2<{address: string}>('SELECT address FROM pool;')
  .then((res) => res.map((r) => r.address));

export const verifyPool = async (address: string) => {
  await queryv2(
    `INSERT INTO verified_contract
      (address, name, filename, source,  optimization, compiler_version, compiled_data,  args, runs, target, type, contract_data)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT DO NOTHING;`,
    [
      address,
      'ReefswapV2Pair',
      'ReefswapV2Pair.sol',
      ReefswapV2PairSource,
      true,
      'v0.5.16+commit.9c3226ce',
      JSON.stringify({ ReefswapV2Pair: ReefswapPairAbi }),
      [],
      999999,
      'london',
      'ERC20',
      {
        name: 'Reefswap V2',
        symbol: 'REEF-V2',
        decimals: 18,
      },
    ],
  );
};

export const verifyPools = async () => {
  const pools = await findPoolsToVerify();
  for (const pool of pools) {
    await verifyPool(pool);
  }
};
