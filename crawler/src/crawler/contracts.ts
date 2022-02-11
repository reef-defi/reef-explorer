import { nodeProvider } from "../utils/connector";
import logger from '../utils/logger';
import { insertV2 } from '../utils/connector';
import { toContractAddress, wait } from '../utils/utils';
import type { StorageKey } from '@polkadot/types';
import type { AnyTuple, Codec } from '@polkadot/types/types';

type Codes = {[codeHash: string]: string};

const batchLoadContracts = async (): Promise<void> => {
    const contractData = await nodeProvider.query((provider) => provider.api.query.evm.accounts.entries());
    await parseAndInsertContracts(contractData);
}

const subscribeContracts = async () => {
    const unsub = nodeProvider.getProvider().api.query.evm.accounts(async ([key, data]: [StorageKey<AnyTuple>, Codec]): Promise<void> => {
        /* wait for finalized blocks to be parsed */
        await wait(20);
        try {
          await parseAndInsertContracts([[key, data]]);
        } catch (e) {
          logger.error(e);
        }
      });
    return unsub
}

export const parseAndInsertContracts = async (contractData: [StorageKey<AnyTuple>, Codec][]): Promise<void> => {
    const codes: Codes = await getCodes();
    const contracts: any[][] = contractData.map(([key, data]) => {
        const contract = data.toHuman() as any;
        return {
            address: key.toHuman()?.toString() || undefined,
            codeHash: contract?.contractInfo?.codeHash || undefined,
            maintainer: contract?.contractInfo?.maintainer || undefined
            }
        })
        .filter(({address, codeHash, maintainer}) => address && codeHash && maintainer)
        .map(({address, codeHash, maintainer}): any[] => {
            return [
                toContractAddress(address!),
                -1,
                maintainer,
                codes[codeHash],                 
                '',
                '',
                '0',
                '0',
                (new Date()).toUTCString()
            ]
        });
    await insertV2(`
    INSERT INTO contract
        (address, extrinsic_id, signer, bytecode, bytecode_context, bytecode_arguments, gas_limit, storage_limit, timestamp)
    VALUES
        %L
    ON CONFLICT (address) DO NOTHING;
    `, contracts);
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


Promise.resolve()
    .then(async () => await nodeProvider.initializeProviders())
    .then(async () => await batchLoadContracts())
    .then(async () => await subscribeContracts())
    .then(async () => {
        while(true) {
          await wait(100000);
        };
    })
    .catch((error) => {
        logger.error(error);
    })
    .finally(async () => {
        await nodeProvider.closeProviders();
        logger.info("Finished")
        process.exit();
    });