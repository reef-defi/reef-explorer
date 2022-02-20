import { nodeProvider } from "../utils/connector";
import logger from '../utils/logger';
import { insertV2 } from '../utils/connector';
import { toChecksumAddress, } from '../utils/utils';
import type { StorageKey } from '@polkadot/types';
import type { AnyTuple, Codec } from '@polkadot/types/types';
import type { BlockHash } from '@polkadot/types/interfaces/chain';

type Codes = {[codeHash: string]: string};

export const parseAndInsertContracts = async (blockNumber: number): Promise<void> => {
    const blockHash = await nodeProvider.query((provider) => provider.api.rpc.chain.getBlockHash(blockNumber));
    const contractData: [StorageKey<AnyTuple>, Codec][] = await nodeProvider.query((provider) => provider.api.query.evm.accounts.entriesAt(blockHash));
    const codes: Codes = await getCodes(blockHash);
    const contracts: Promise<any[]>[] = contractData.map(([key, data]) => {
        const contract = data.toHuman() as any;
        return {
            address: key.toHuman()?.toString() || undefined,
            codeHash: contract?.contractInfo?.codeHash || undefined,
            maintainer: contract?.contractInfo?.maintainer || undefined
            }
        })
        .filter(({address, codeHash, maintainer}) => address && codeHash && maintainer)
        .map(async ({address, codeHash, maintainer}): Promise<any[]> => {
            const signer = await nodeProvider.query((provider) => provider.api.query.evmAccounts.accounts(maintainer));
            return [
                toChecksumAddress(address!),
                -1,
                signer.toHuman()?.toString() || '0x',
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
    `, await Promise.all(contracts));
}
  
const getCodes = async (blockHash: BlockHash): Promise<Codes> => {
    const codeData = await nodeProvider.query((provider) => provider.api.query.evm.codes.entriesAt(blockHash));
    return codeData
    .map(([key, data]) => [key.toHuman()?.toString(), data.toHuman()?.toString()])
    .reduce(
      (acc, [key, data]) => ({...acc, [key!]: data!}),
      {}
    );
}
