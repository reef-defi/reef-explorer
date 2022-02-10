import { nodeProvider } from "../utils/connector";
import logger from '../utils/logger';
import { Contract } from './types';
import { insert } from '../utils/connector';
import { contractToValues } from '../queries/evmEvent';

type Codes = {[codeHash: string]: string};

const batchLoadContracts = async (): Promise<void> => {
    const codes: Codes = await getCodes();
    const contractData = await nodeProvider.query((provider) => provider.api.query.evm.accounts.entries());
    const contracts: Contract[] = contractData.map(([key, data]) => {
        const contract = data.toHuman() as any;
        return {
            address: key.toHuman()?.toString() || undefined,
            codeHash: contract?.contractInfo?.codeHash || undefined,
            maintainer: contract?.contractInfo?.maintainer || undefined
            }
        })
        .filter(({address, codeHash, maintainer}) => address && codeHash && maintainer)
        .map(({address, codeHash, maintainer}): Contract => {
            return {
                address: address!, 
                bytecode: codes[codeHash], 
                signer: maintainer,
                extrinsicId: -1,
                bytecodeContext: '',
                bytecodeArguments: '',
                gasLimit: '',
                storageLimit: '',
                timestamp: ''
            }
        });
    await insert(`
    INSERT INTO contract
        (address, extrinsic_id, signer, bytecode, bytecode_context, bytecode_arguments, gas_limit, storage_limit, timestamp)
    VALUES
        ${contracts.map(contractToValues).filter(v=>!!v).join(',\n')}
    ON CONFLICT (address) DO NOTHING;
    `);
}

const getCodes = async (): Promise<Codes> => {
    const codeData = await nodeProvider.query((provider) => provider.api.query.evm.codes.entries());
    return codeData
    .map(([key, data]) => [key.toHuman()?.toString(), data.toHuman()?.toString()])
    .reduce(
      (acc, [key, data]) => ({...acc, [key!]: data!}),
      {}
    );
}


Promise.resolve().then(async () => {
    await nodeProvider.initializeProviders();
  })
  .then(async () => await batchLoadContracts())
  .catch((error) => {
    logger.error(error);
  })
  .finally(async () => {
    await nodeProvider.closeProviders();
    logger.info("Finished")
    process.exit();
  });