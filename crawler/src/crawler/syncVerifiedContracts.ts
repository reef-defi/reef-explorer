import { gql } from '@apollo/client/core';
import format from 'pg-format';
import { GraphqlServer, liveGraphqlServer, queryv2 } from '../utils/connector';
import logger from '../utils/logger';
import { toChecksumAddress } from '../utils/utils';

interface VerifiedContractAddresses {
  verified_contract: {
    address: string;
  }[]
}
interface VerifiedContract {
  address: string;
  name: string;
  filename: string;
  source: any;
  optimization: boolean;
  compiler_version: string;
  compiled_data: any;
  args: any[];
  runs: number;
  target: string;
  type: string;
  contract_data: any;
}

interface LoadedVerifiedContracts {
  verified_contract: VerifiedContract[];
}

interface AddressesVar {
  address: {} | { _in: string[] };
}

const loadVerifiedContractAddresses = async (server: GraphqlServer): Promise<string[]> => server.query<VerifiedContractAddresses>({
  query: gql`
      query verified_addresses {
        verified_contract {
          address
        }
      }    
    `,
})
  .then((res) => res.data.verified_contract
    .map(({ address }) => address));

const insertVerifiedContracts = async (contracts: VerifiedContract[]): Promise<void> => {
  await queryv2(
    format(
      `INSERT INTO verified_contract
        (address, name, filename, source,  optimization, compiler_version, compiled_data,  args, runs, target, type, contract_data)
      VALUES 
        %L
      ON CONFLICT DO NOTHING;`,
      contracts.map((c) => [
        toChecksumAddress(c.address),
        c.name,
        c.filename,
        JSON.stringify(c.source),
        c.optimization,
        c.compiler_version,
        JSON.stringify(c.compiled_data),
        JSON.stringify(c.args),
        c.runs,
        c.target,
        c.type,
        JSON.stringify(c.contract_data),
      ]),
    ),
  );
};

const loadVerifiedContracts = async (addresses: string[]): Promise<VerifiedContract[]> => liveGraphqlServer
  .query<LoadedVerifiedContracts, AddressesVar>({
    query: gql`
      query verified_contracts($address: String_comparison_exp!) {
        verified_contract(
          where: { address: $address }
        ) {
          address
          args
          compiled_data
          compiler_version
          contract_data
          filename
          name
          optimization
          runs
          source
          target
          timestamp
          type
        }
      }    
    `,
    variables: { address: { _in: addresses } },
  })
  .then((res) => res.data.verified_contract);

const localVerifiedContractsAddresses = async (): Promise<string[]> => queryv2<{address: string}>('SELECT address FROM verified_contract')
  .then((res) => res.map(({ address }) => address))
  .then((res) => res.map((val) => val.toLocaleLowerCase()));

export default async (): Promise<void> => {
  logger.info('Loading verified contract addresses');
  const localVerifiedContracts = await localVerifiedContractsAddresses();
  const liveVerifiedContracts = await loadVerifiedContractAddresses(liveGraphqlServer);

  const missingContracts = liveVerifiedContracts
    .filter((address) => !localVerifiedContracts.includes(address.toLocaleLowerCase()));

  if (missingContracts.length === 0) {
    return;
  }

  logger.info(`Loading following missing contracts: \n- ${missingContracts.join('\n- ')}`);
  const contracts = await loadVerifiedContracts(missingContracts);

  logger.info('Inserting missing contracts');
  await insertVerifiedContracts(contracts);

  logger.info('Verified contract sync complete');
};
