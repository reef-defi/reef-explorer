// @ts-check
const pino = require('pino');
const { Provider } = require('@reef-defi/evm-provider');
const { WsProvider } = require('@polkadot/api');
const { decodeAddress, encodeAddress } = require('@polkadot/keyring');
const { hexToU8a, isHex } = require('@polkadot/util');
const { Client } = require('pg');
const _ = require('lodash');
const { toChecksumAddress } = require('web3-utils');
const config = require('../backend.config');
const genesisContracts = require('../assets/bytecodes.json');

const logger = pino();

module.exports = {
  getPolkadotAPI: async (loggerOptions) => {
    logger.debug(loggerOptions, `Connecting to ${config.wsProviderUrl}`);
    const provider = new Provider({
      provider: new WsProvider(config.wsProviderUrl),
    });
    await provider.api.isReady;
    return provider.api;
  },
  isNodeSynced: async (api, loggerOptions) => {
    let node;
    try {
      node = await api.rpc.system.health();
    } catch {
      logger.error(loggerOptions, "Can't query node status");
    }
    if (node && node.isSyncing.eq(false)) {
      logger.debug(loggerOptions, 'Node is synced!');
      return true;
    }
    logger.debug(loggerOptions, 'Node is NOT synced!');
    return false;
  },
  formatNumber: (number) => (number.toString()).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,'),
  shortHash: (hash) => `${hash.substr(0, 6)}…${hash.substr(hash.length - 5, 4)}`,
  wait: async (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
  }),
  getClient: async (loggerOptions) => {
    logger.debug(loggerOptions, `Connecting to DB ${config.postgresConnParams.database} at ${config.postgresConnParams.host}:${config.postgresConnParams.port}`);
    const client = new Client(config.postgresConnParams);
    await client.connect();
    return client;
  },
  dbQuery: async (client, sql, loggerOptions) => {
    try {
      return await client.query(sql);
    } catch (error) {
      logger.error(loggerOptions, `SQL: ${sql} ERROR: ${JSON.stringify(error)}`);
    }
    return null;
  },
  dbParamQuery: async (client, sql, data, loggerOptions) => {
    try {
      return await client.query(sql, data);
    } catch (error) {
      logger.error(loggerOptions, `SQL: ${sql} PARAM: ${JSON.stringify(data)} ERROR: ${JSON.stringify(error)}`);
    }
    return null;
  },
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
  updateAccountsInfo: async (api, client, blockNumber, timestamp, loggerOptions, blockEvents) => {
    const startTime = new Date().getTime();
    const involvedAddresses = [];
    blockEvents
      .forEach(({ event }) => {
        event.data.forEach((arg) => {
          if (module.exports.isValidAddressPolkadotAddress(arg)) {
            involvedAddresses.push(arg);
          }
        });
      });
    const uniqueAddresses = _.uniq(involvedAddresses);
    await Promise.all(
      uniqueAddresses.map(
        (address) => module.exports.updateAccountInfo(
          api, client, blockNumber, timestamp, address, loggerOptions,
        ),
      ),
    );
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Updated ${uniqueAddresses.length} accounts in ${((endTime - startTime) / 1000).toFixed(3)}s`);
  },
  updateAccountInfo: async (api, client, blockNumber, timestamp, address, loggerOptions) => {
    const [balances, { identity }] = await Promise.all([
      api.derive.balances.all(address),
      api.derive.accounts.info(address),
    ]);
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
                    identity_display = EXCLUDED.identity_display,
                    identity_display_parent = EXCLUDED.identity_display_parent,
                    balances = EXCLUDED.balances,
                    available_balance = EXCLUDED.available_balance,
                    free_balance = EXCLUDED.free_balance,
                    locked_balance = EXCLUDED.locked_balance,
                    nonce = EXCLUDED.nonce,
                    timestamp = EXCLUDED.timestamp,
                    block_height = EXCLUDED.block_height;
    `;
    try {
      // eslint-disable-next-line no-await-in-loop
      await client.query(sql);
      logger.debug(loggerOptions, `Updated account info for event/s involved address ${address}`);
    } catch (error) {
      logger.error(loggerOptions, `Error updating account info for event/s involved address: ${JSON.stringify(error)}`);
    }
  },
  processExtrinsics: async (
    api,
    client,
    blockNumber,
    blockHash,
    extrinsics,
    blockEvents,
    timestamp,
    loggerOptions,
  ) => {
    const startTime = new Date().getTime();
    await Promise.all(
      extrinsics.map((extrinsic, index) => module.exports.processExtrinsic(
        api,
        client,
        blockNumber,
        blockHash,
        extrinsic,
        index,
        blockEvents,
        timestamp,
        loggerOptions,
      )),
    );
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${extrinsics.length} extrinsics in ${((endTime - startTime) / 1000).toFixed(3)}s`);
  },
  processExtrinsic: async (
    api,
    client,
    blockNumber,
    blockHash,
    extrinsic,
    index,
    blockEvents,
    timestamp,
    loggerOptions,
  ) => {
    const { isSigned } = extrinsic;
    const signer = isSigned ? extrinsic.signer.toString() : '';
    const { section } = extrinsic.toHuman().method;
    const { method } = extrinsic.toHuman().method;
    const args = JSON.stringify(extrinsic.args);
    const hash = extrinsic.hash.toHex();
    const doc = extrinsic.meta.documentation.toString().replace(/'/g, "''");
    const success = module.exports.getExtrinsicSuccess(index, blockEvents);

    // Fees
    let feeInfo = '';
    let feeDetails = '';
    if (isSigned) {
      [feeInfo, feeDetails] = await Promise.all([
        api.rpc.payment.queryInfo(extrinsic.toHex(), blockHash)
          .then((result) => JSON.stringify(result.toJSON()))
          .catch((error) => logger.debug(loggerOptions, `API Error: ${error}`)) || '',
        api.rpc.payment.queryFeeDetails(extrinsic.toHex(), blockHash)
          .then((result) => JSON.stringify(result.toJSON()))
          .catch((error) => logger.debug(loggerOptions, `API Error: ${error}`)) || '',
      ]);
    }

    let sql = `INSERT INTO extrinsic (
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
      await client.query(sql);
      logger.debug(loggerOptions, `Added extrinsic ${blockNumber}-${index} (${module.exports.shortHash(hash)}) ${section} ➡ ${method}`);
    } catch (error) {
      logger.error(loggerOptions, `Error adding extrinsic ${blockNumber}-${index}: ${JSON.stringify(error)}`);
    }

    if (isSigned) {
      // Store signed extrinsic
      sql = `INSERT INTO signed_extrinsic (
        block_number,
        extrinsic_index,
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
      ON CONFLICT ON CONSTRAINT signed_extrinsic_pkey 
      DO NOTHING;
      ;`;
      try {
        await client.query(sql);
        logger.debug(loggerOptions, `Added signed extrinsic ${blockNumber}-${index} (${module.exports.shortHash(hash)}) ${section} ➡ ${method}`);
      } catch (error) {
        logger.error(loggerOptions, `Error adding signed extrinsic ${blockNumber}-${index}: ${JSON.stringify(error)}`);
      }
      if (section === 'balances' || section === 'currencies') {
        // Store transfer
        const source = signer;
        const destination = extrinsic.args[0].id;
        const amount = section === 'currencies'
          ? JSON.parse(extrinsic.args)[2]
          : JSON.parse(extrinsic.args)[1];
        const denom = section === 'currencies'
          ? JSON.parse(extrinsic.args)[1].token
          : 'REEF';
        const feeAmount = JSON.parse(feeInfo).partialFee;
        let errorMessage = '';
        if (!success) {
          errorMessage = module.exports.getExtrinsicError(index, blockEvents);
        }
        sql = `INSERT INTO transfer (
            block_number,
            extrinsic_index,
            section,
            method,
            hash,
            source,
            destination,
            amount,
            denom,
            fee_amount,      
            success,
            error_message,
            timestamp
          ) VALUES (
            '${blockNumber}',
            '${index}',
            '${section}',
            '${method}',
            '${hash}',
            '${source}',
            '${destination}',
            '${amount}',
            '${denom}',
            '${feeAmount}',
            '${errorMessage}',
            '${success}',
            '${timestamp}'
          )
          ON CONFLICT ON CONSTRAINT transfer_pkey 
          DO NOTHING;
          ;`;
        try {
          await client.query(sql);
          logger.debug(loggerOptions, `Added transfer ${blockNumber}-${index} (${module.exports.shortHash(hash)}) ${section} ➡ ${method}`);
        } catch (error) {
          logger.error(loggerOptions, `Error adding transfer ${blockNumber}-${index}: ${JSON.stringify(error)}`);
        }
        // update total transfers
        module.exports.updateTotalTransfers(client, loggerOptions);
      }

      // store contract
      if (section === 'evm' && method === 'create' && success) {
        module.exports.updateTotalContracts(client, loggerOptions);
        // 0x29c08687a237fdc32d115f6b6c885428d170a2d8
        const contractId = toChecksumAddress(
          JSON.parse(
            JSON.stringify(
              blockEvents.find(
                ({ event }) => event.section === 'evm' && event.method === 'Created',
              ),
            ),
          ).event.data[0],
        );
        // https://reefscan.com/block/?blockNumber=118307
        const name = '';
        const bytecode = extrinsic.args[0];
        const value = extrinsic.args[1];
        const gasLimit = extrinsic.args[2];
        const storageLimit = extrinsic.args[3];
        const contractSql = `INSERT INTO contract (
            contract_id,
            name,
            bytecode,
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
          await client.query(contractSql);
          logger.info(loggerOptions, `Added contract ${contractId} at block #${blockNumber}`);
        } catch (error) {
          logger.error(loggerOptions, `Error adding contract ${contractId} at block #${blockNumber}: ${JSON.stringify(error)}`);
        }
      }
    }
  },
  processEvents: async (
    client, blockNumber, blockEvents, timestamp, loggerOptions,
  ) => {
    const startTime = new Date().getTime();
    await Promise.all(
      blockEvents.map((record, index) => module.exports.processEvent(
        client, blockNumber, record, index, timestamp, loggerOptions,
      )),
    );
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${blockEvents.length} events in ${((endTime - startTime) / 1000).toFixed(3)}s`);
  },
  processEvent: async (
    client, blockNumber, record, index, timestamp, loggerOptions,
  ) => {
    const { event, phase } = record;
    const sql = `INSERT INTO event (
      block_number,
      event_index,
      section,
      method,
      phase,
      data,
      timestamp
    ) VALUES (
      '${blockNumber}',
      '${index}',
      '${event.section}',
      '${event.method}',
      '${phase.toString()}',
      '${JSON.stringify(event.data)}',
      '${timestamp}'
    )
    ON CONFLICT ON CONSTRAINT event_pkey 
    DO NOTHING
    ;`;
    try {
      // eslint-disable-next-line no-await-in-loop
      await client.query(sql);
      logger.debug(loggerOptions, `Added event #${blockNumber}-${index} ${event.section} ➡ ${event.method}`);
    } catch (error) {
      logger.error(loggerOptions, `Error adding event #${blockNumber}-${index}: ${error}, sql: ${sql}`);
    }
  },
  processLogs: async (client, blockNumber, logs, timestamp, loggerOptions) => {
    const startTime = new Date().getTime();
    await Promise.all(
      logs.map((log, index) => module.exports.processLog(
        client, blockNumber, log, index, timestamp, loggerOptions,
      )),
    );
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${logs.length} logs in ${((endTime - startTime) / 1000).toFixed(3)}s`);
  },
  processLog: async (client, blockNumber, log, index, timestamp, loggerOptions) => {
    const { type } = log;
    const [[engine, data]] = Object.values(log.toJSON());
    const sql = `INSERT INTO log (
        block_number,
        log_index,
        type,
        engine,
        data,
        timestamp
      ) VALUES (
        '${blockNumber}',
        '${index}',
        '${type}',
        '${engine}',
        '${data}',
        '${timestamp}'
      )
      ON CONFLICT ON CONSTRAINT log_pkey 
      DO NOTHING;
      ;`;
    try {
      await client.query(sql);
      logger.debug(loggerOptions, `Added log ${blockNumber}-${index}`);
    } catch (error) {
      logger.error(loggerOptions, `Error adding log ${blockNumber}-${index}: ${JSON.stringify(error)}`);
    }
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
  getExtrinsicError: (index, blockEvents) => JSON.stringify(
    blockEvents
      .find(({ event, phase }) => (
        parseInt(phase.toHuman().ApplyExtrinsic, 10) === index
          && event.section === 'system'
          && event.method === 'ExtrinsicFailed'
      )).event.data || '',
  ),
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
  updateTotalTransfers: async (client, loggerOptions) => {
    const sql = `
      UPDATE total SET count = (SELECT count(*) FROM transfer) WHERE name = 'transfers';
    `;
    try {
      await client.query(sql);
    } catch (error) {
      logger.error(loggerOptions, `Error updating totals transfers ${error}`);
    }
  },
  updateTotalContracts: async (client, loggerOptions) => {
    const sql = `
      UPDATE total SET count = (SELECT count(*) FROM contract) WHERE name = 'contracts';
    `;
    try {
      await client.query(sql);
    } catch (error) {
      logger.error(loggerOptions, `Error updating totals contracts ${error}`);
    }
  },
  updateFinalized: async (client, finalizedBlock, loggerOptions) => {
    const sql = `
      UPDATE block SET finalized = true WHERE finalized = false AND block_number <= ${finalizedBlock};
    `;
    try {
      await client.query(sql);
    } catch (error) {
      logger.error(loggerOptions, `Error updating finalized blocks: ${error}`);
    }
  },
  logHarvestError: async (client, blockNumber, error, loggerOptions) => {
    const timestamp = new Date().getTime();
    const errorString = error.toString().replace(/'/g, "''");
    const data = [
      blockNumber,
      errorString,
      timestamp,
    ];
    const query = `
      INSERT INTO
        harvest_error (block_number, error, timestamp)
      VALUES
        ($1, $2, $3)
      ON CONFLICT ON CONSTRAINT
        harvest_error_pkey 
        DO NOTHING
      ;`;
    await module.exports.dbParamQuery(client, query, data, loggerOptions);
  },
  async storeGenesisContracts(api, client, loggerOptions) {
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
      const value = '';
      const gasLimit = '';
      const storageLimit = '';
      const contractSql = `INSERT INTO contract (
        contract_id,
        name,
        bytecode,
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
        await client.query(contractSql);
        // @ts-ignore
        logger.info(loggerOptions, `Added contract ${name} with address ${contractId} at block #${blockNumber}`);
      } catch (error) {
        logger.error(loggerOptions, `Error adding contract ${name} with address ${contractId} at block #${blockNumber}: ${JSON.stringify(error)}`);
      }
    }
  },
};
