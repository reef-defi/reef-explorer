
import { gql } from "@apollo/client/core";
import { GraphqlServer, localGraphqlServer,  queryv2 } from "../utils/connector";
import logger from '../utils/logger';
import format from 'pg-format';

interface VerifiedContractAddresses {
  verified_contract: {
    address: string[];
  }
}
const loadVerifiedContractAddresses = async (server: GraphqlServer): Promise<string[]> =>
  server.query<VerifiedContractAddresses>({
    query: gql`
      query verified_addresses {
        verified_contract {
          address
        }
      }    
    `
  })
  .then((res) => res.data.verified_contract.address);

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

const insertVerifiedContracts = async (contracts: VerifiedContract[]): Promise<void> => {
  await queryv2(
    format(
      `INSERT INTO verified_contract
        (address, name, filename, source,  optimization, compiler_version, compiled_data,  args, runs, target, type, contract_data)
      VALUES 
        %l
      ON CONFLICT DO NOTHING;`,
      contracts.map((c) => 
        [
          c.address, 
          c.name, 
          c.filename, 
          c.source, 
          c.optimization, 
          c.compiler_version, 
          c.compiled_data, 
          c.args, 
          c.runs, 
          c.target, 
          c.type, 
          c.contract_data
        ]
      )
    )
  )
}

interface LoadedVerifiedContracts {
  verified_contract: VerifiedContract[];
}

interface AddressesVar {
  addresses: string[];
}
const loadVerifiedContracts = async (addresses: string[]): Promise<VerifiedContract[]> => localGraphqlServer
  .query<LoadedVerifiedContracts, AddressesVar>({
    query: gql`
      query verified_contracts($addresses: String[]!) {
        verified_contract(
          where: { address: { _in: $addresses}}
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
    variables: { addresses }
  })
  .then((res) => res.data.verified_contract);

export default async (): Promise<void> => {
  console.log('Loading addresses')
  const localVerifiedContracts = await loadVerifiedContractAddresses(localGraphqlServer);
  console.log(localVerifiedContracts)
  // const liveVerifiedContracts = await loadVerifiedContractAddresses(localGraphqlServer);
  // console.log(liveVerifiedContracts)

  // const missingContracts = liveVerifiedContracts
  //   .filter((address) => !localVerifiedContracts.includes(address));

  // if (missingContracts.length === 0) {
  //   return;
  // }
  // logger.info(`Loading following missing contracts: \n- ${missingContracts.join("\n- ")}`);
  // const contracts = await loadVerifiedContracts(missingContracts);

  // logger.info('Inserting missing contracts');
  // await insertVerifiedContracts(contracts);

  // logger.info('Verified contract sync complete');
}