// @ts-check
const pino = require('pino');
const { decodeAddress, encodeAddress } = require('@polkadot/keyring');
const { hexToU8a, isHex } = require('@polkadot/util');
const genesisContracts = require('./assets/bytecodes.json');

const logger = pino();

module.exports = {
  formatNumber: (number) => (number.toString()).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,'),
  shortHash: (hash) => `${hash.substr(0, 6)}…${hash.substr(hash.length - 5, 4)}`,
  wait: async (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
  }),
  isValidAddressPolkadotAddress: (address) => {
    try {
      encodeAddress(
        isHex(address)
          ? hexToU8a(address.toString())
          : decodeAddress(address),
      );
      return true;
    } catch (error) {
      return false;
    }
  },
  updateBalances: async (api, pool, blockNumber, timestamp, loggerOptions, addresses) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const address of addresses) {
      // eslint-disable-next-line no-await-in-loop
      const balances = await api.derive.balances.all(address);
      // eslint-disable-next-line no-await-in-loop
      const { identity } = await api.derive.accounts.info(address);
      const availableBalance = balances.availableBalance.toString();
      const freeBalance = balances.freeBalance.toString();
      const lockedBalance = balances.lockedBalance.toString();
      const identityDisplay = identity.display ? identity.display.toString() : '';
      const identityDisplayParent = identity.displayParent ? identity.displayParent.toString() : '';
      const JSONIdentity = identity.display ? JSON.stringify(identity) : '';
      const JSONbalances = JSON.stringify(balances);
      const nonce = balances.accountNonce.toString();
      const sql = `
        INSERT INTO   account (account_id, identity, identity_display, identity_display_parent, balances, available_balance, free_balance, locked_balance, nonce, timestamp, block_height)
        VALUES        ('${address}', '${JSONIdentity}', '${identityDisplay}', '${identityDisplayParent}', '${JSONbalances}', '${availableBalance}', '${freeBalance}', '${lockedBalance}', '${nonce}', '${timestamp}', '${blockNumber}')
        ON CONFLICT   (account_id)
        DO UPDATE
        SET           identity = EXCLUDED.identity,
                      balances = EXCLUDED.balances,
                      available_balance = EXCLUDED.available_balance,
                      free_balance = EXCLUDED.free_balance,
                      timestamp = EXCLUDED.timestamp,
                      block_height = EXCLUDED.block_height;
      `;
      try {
        // eslint-disable-next-line no-await-in-loop
        await pool.query(sql);
        logger.info(loggerOptions, `Updated balances of addresses: (${addresses.join(', ')}`);
      } catch (error) {
        logger.error(loggerOptions, `Error updating balances for involved addresses: ${JSON.stringify(error)}`);
      }
    }
  },
  storeExtrinsics: async (
    api,
    pool,
    blockNumber,
    blockHash,
    extrinsics,
    blockEvents,
    timestamp,
    loggerOptions,
  ) => {
    const startTime = new Date().getTime();
    extrinsics.forEach(async (extrinsic, index) => {
      const { isSigned } = extrinsic;
      const signer = isSigned ? extrinsic.signer.toString() : '';
      const { section } = extrinsic.toHuman().method;
      const { method } = extrinsic.toHuman().method;
      const args = JSON.stringify(extrinsic.args);
      const hash = extrinsic.hash.toHex();
      const doc = extrinsic.meta.documentation.toString().replace(/'/g, "''");

      // fees
      const feeInfo = isSigned
        ? JSON.stringify(
          (await api.rpc.payment.queryInfo(extrinsic.toHex(), blockHash)).toJSON(),
        )
        : '';
      const feeDetails = isSigned
        ? JSON.stringify(
          (await api.rpc.payment.queryFeeDetails(extrinsic.toHex(), blockHash)).toJSON(),
        )
        : '';

      const success = module.exports.getExtrinsicSuccess(index, blockEvents);
      const sql = `INSERT INTO extrinsic (
          block_number,
          extrinsic_index,
          is_signed,
          signer,
          section,
          method,
          args,
          hash,
          doc,
          fee_info,
          fee_details,
          success,
          timestamp
        ) VALUES (
          '${blockNumber}',
          '${index}',
          '${isSigned}',
          '${signer}',
          '${section}',
          '${method}',
          '${args}',
          '${hash}',
          '${doc}',
          '${feeInfo}',
          '${feeDetails}',
          '${success}',
          '${timestamp}'
        )
        ON CONFLICT ON CONSTRAINT extrinsic_pkey 
        DO NOTHING;
        ;`;
      try {
        await pool.query(sql);
        logger.info(loggerOptions, `Added extrinsic ${blockNumber}-${index} (${module.exports.shortHash(hash)}) ${section} ➡ ${method}`);
      } catch (error) {
        logger.error(loggerOptions, `Error adding extrinsic ${blockNumber}-${index}: ${JSON.stringify(error)}`);
      }
      // store contract
      if (section === 'evm' && method === 'create' && success) {
        // 0x29c08687a237fdc32d115f6b6c885428d170a2d8
        const contractId = JSON.parse(
          JSON.stringify(
            blockEvents.find(
              ({ event }) => event.section === 'evm' && event.method === 'Created',
            ),
          ),
        ).event.data[0];
        // https://reefscan.com/block/?blockNumber=118307
        const name = ''; // TODO: match bytecode with stored contracts to get name
        const bytecode = extrinsic.args[0]; // TODO: figure out if this is correct
        const init = extrinsic.args[0];
        const value = extrinsic.args[1];
        const gasLimit = extrinsic.args[2];
        const storageLimit = extrinsic.args[3];
        const contractSql = `INSERT INTO contract (
          contract_id,
          name,
          bytecode,
          init,
          value,
          gas_limit,
          storage_limit,
          signer,
          block_height,
          timestamp
        ) VALUES (
          '${contractId}',
          '${name}',
          '${bytecode}',
          '${init}',
          '${value}',
          '${gasLimit}',
          '${storageLimit}',
          '${signer}',
          '${blockNumber}',
          '${timestamp}'
        )
        ON CONFLICT ON CONSTRAINT contract_pkey 
        DO NOTHING;
        ;`;
        try {
          await pool.query(contractSql);
          logger.info(loggerOptions, `Added contract ${contractId} at block #${blockNumber}`);
        } catch (error) {
          logger.error(loggerOptions, `Error adding contract ${contractId} at block #${blockNumber}: ${JSON.stringify(error)}`);
        }
      }
    });

    // Log execution time
    const endTime = new Date().getTime();
    logger.info(loggerOptions, `Added ${extrinsics.length} extrinsics in ${((endTime - startTime) / 1000).toFixed(3)}s`);
  },
  getExtrinsicSuccess: (index, blockEvents) => {
    // assume success if no events were extracted
    if (blockEvents.length === 0) {
      return true;
    }
    let extrinsicSuccess = false;
    blockEvents.forEach((record) => {
      const { event, phase } = record;
      if (
        parseInt(phase.toHuman().ApplyExtrinsic, 10) === index
        && event.section === 'system'
        && event.method === 'ExtrinsicSuccess'
      ) {
        extrinsicSuccess = true;
      }
    });
    return extrinsicSuccess;
  },
  getDisplayName: (identity) => {
    if (
      identity.displayParent
      && identity.displayParent !== ''
      && identity.display
      && identity.display !== ''
    ) {
      return `${identity.displayParent} / ${identity.display}`;
    }
    return identity.display || '';
  },
  updateTotals: async (pool, loggerOptions) => {
    const sql = `
        UPDATE total SET count = (SELECT count(*) FROM block) WHERE name = 'blocks';
        UPDATE total SET count = (SELECT count(*) FROM extrinsic) WHERE name = 'extrinsics';
        UPDATE total SET count = (SELECT count(*) FROM extrinsic WHERE (section = 'balances' AND method LIKE 'transfer%') OR (section = 'currencies' AND method = 'transfer')) WHERE name = 'transfers';
        UPDATE total SET count = (SELECT count(*) FROM event) WHERE name = 'events';
        UPDATE total SET count = (SELECT count(*) FROM contract) WHERE name = 'contracts';
      `;
    try {
      await pool.query(sql);
    } catch (error) {
      logger.error(loggerOptions, `Error updating total harvested blocks, extrinsics and events: ${error}`);
    }
  },
  async storeGenesisContracts(api, pool, loggerOptions) {
    // Get timestamp from block #1, genesis doesn't return timestamp
    const blockHash = await api.rpc.chain.getBlockHash(1);
    const timestampMs = await api.query.timestamp.now.at(blockHash);
    const timestamp = Math.floor(timestampMs / 1000);
    // eslint-disable-next-line no-restricted-syntax
    for (const contract of genesisContracts) {
      const blockNumber = 0;
      const signer = '';
      const name = contract[0];
      const contractId = contract[1];
      const bytecode = contract[2];
      const init = bytecode; // TODO: figure out if this is correct
      const value = '';
      const gasLimit = '';
      const storageLimit = '';
      const contractSql = `INSERT INTO contract (
        contract_id,
        name,
        bytecode,
        init,
        value,
        gas_limit,
        storage_limit,
        signer,
        block_height,
        timestamp
      ) VALUES (
        '${contractId}',
        '${name}',
        '${bytecode}',
        '${init}',
        '${value}',
        '${gasLimit}',
        '${storageLimit}',
        '${signer}',
        '${blockNumber}',
        '${timestamp}'
      )
      ON CONFLICT ON CONSTRAINT contract_pkey 
      DO NOTHING;
      ;`;
      try {
        // eslint-disable-next-line no-await-in-loop
        await pool.query(contractSql);
        // @ts-ignore
        logger.info(loggerOptions, `Added contract ${name} with address ${contractId} at block #${blockNumber}`);
      } catch (error) {
        logger.error(loggerOptions, `Error adding contract ${name} with address ${contractId} at block #${blockNumber}: ${JSON.stringify(error)}`);
      }
    }
  },
};
