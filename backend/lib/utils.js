// @ts-check
const pino = require('pino');
const { Provider } = require('@reef-defi/evm-provider');
const { WsProvider } = require('@polkadot/api');
const { decodeAddress, encodeAddress } = require('@polkadot/keyring');
const { hexToU8a, isHex } = require('@polkadot/util');
const { Client } = require('pg');
const _ = require('lodash');
const { toChecksumAddress } = require('web3-utils');
const { BigNumber } = require('bignumber.js');
const { ethers } = require('ethers');
const config = require('../backend.config');
const { INSERT_CONTRACT_SQL } = require('./sqlStatements');

const logger = pino({
  level: config.logLevel,
});

module.exports = {
  getPolkadotAPI: async (loggerOptions) => {
    logger.debug(loggerOptions, `Connecting to ${config.wsProviderUrl}`);
    const provider = new Provider({
      provider: new WsProvider(config.wsProviderUrl),
    });
    await provider.api.isReady;
    return provider.api;
  },
  getProviderAPI: async (loggerOptions) => {
    logger.debug(loggerOptions, `Connecting to ${config.wsProviderUrl}`);
    const provider = new Provider({
      provider: new WsProvider(config.wsProviderUrl),
    });
    await provider.api.isReady;
    return provider;
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
    provider,
    client,
    blockNumber,
    blockHash,
    extrinsics,
    blockEvents,
    timestamp,
    loggerOptions,
  ) => {
    const startTime = new Date().getTime();
    const chunkSize = 100;
    const indexedExtrinsics = extrinsics.map((extrinsic, index) => ([index, extrinsic]));
    const chunks = module.exports.chunker(indexedExtrinsics, chunkSize);
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map((indexedExtrinsic) => module.exports.processExtrinsic(
          provider,
          client,
          blockNumber,
          blockHash,
          indexedExtrinsic,
          blockEvents,
          timestamp,
          loggerOptions,
        )),
      );
    }
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${extrinsics.length} extrinsics in ${((endTime - startTime) / 1000).toFixed(3)}s`);
  },
  processExtrinsic: async (
    provider,
    client,
    blockNumber,
    blockHash,
    indexedExtrinsic,
    blockEvents,
    timestamp,
    loggerOptions,
  ) => {
    const [index, extrinsic]  = indexedExtrinsic;
    const { api } = provider;
    const { isSigned } = extrinsic;
    const signer = isSigned ? extrinsic.signer.toString() : '';
    const { section } = extrinsic.toHuman().method;
    const { method } = extrinsic.toHuman().method;
    const args = JSON.stringify(extrinsic.args);
    const hash = extrinsic.hash.toHex();
    const doc = extrinsic.meta.docs
      ? extrinsic.meta.docs.toString().replace(/'/g, "''")
      : extrinsic.meta.documentation.toString().replace(/'/g, "''");
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
        const destination = JSON.parse(args)[0].id
          ? JSON.parse(args)[0].id
          : JSON.parse(args)[0].address20;
        const amount = section === 'currencies'
          ? JSON.parse(args)[2]
          : JSON.parse(args)[1];
        const denom = section === 'currencies'
          ? JSON.parse(args)[1].token
          : 'REEF';
        const feeAmount = JSON.parse(feeInfo).partialFee;
        const errorMessage = success
          ? ''
          : module.exports.getExtrinsicError(index, blockEvents);
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
            '${new BigNumber(amount).toString(10)}',
            '${denom}',
            '${new BigNumber(feeAmount).toString(10)}',
            '${success}',
            '${errorMessage}',
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
      }

      // store contract
      if (section === 'evm' && method === 'create' && success) {
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

        // deployment bytecode
        const deploymentBytecode = extrinsic.args[0].toString();

        // runtime bytecode
        const bytecode = await module.exports.getContractRuntimeBytecode(provider, contractId, loggerOptions);
        
        // get metadata and arguments
        const { contractMetadata, contractArguments } = module.exports.getContractMetadataAndArguments(deploymentBytecode, bytecode);

        const value = extrinsic.args[1];
        const gasLimit = extrinsic.args[2];
        const storageLimit = extrinsic.args[3];
        const data = [
          contractId,
          signer,
          name,
          value,
          gasLimit,
          storageLimit,
          deploymentBytecode,
          contractMetadata,
          contractArguments,
          blockNumber,
          timestamp
        ];
        try {
          await client.query(INSERT_CONTRACT_SQL, data);
          logger.info(loggerOptions, `Added contract ${contractId} at block #${blockNumber}`);
        } catch (error) {
          console.log("Error when adding new contract!")
          console.error(error);
          console.log("--------------------------------")
          logger.error(loggerOptions, `Error adding contract ${contractId} at block #${blockNumber}: ${JSON.stringify(error)}`);
        }
      }
    }
  },
  processEvents: async (
    client, blockNumber, blockEvents, timestamp, loggerOptions,
  ) => {
    const startTime = new Date().getTime();
    const chunkSize = 100;
    const indexedBlockEvents = blockEvents.map((event, index) => ([index, event]));
    const chunks = module.exports.chunker(indexedBlockEvents, chunkSize);
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map((indexedEvent) => module.exports.processEvent(
          client, blockNumber, indexedEvent, timestamp, loggerOptions,
        )),
      );
    }
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${blockEvents.length} events in ${((endTime - startTime) / 1000).toFixed(3)}s`);
  },
  processEvent: async (
    client, blockNumber, indexedEvent, timestamp, loggerOptions,
  ) => {
    const [index, { event, phase }] = indexedEvent;
    let sql = `INSERT INTO event (
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

    // Store staking reward
    if (event.section === 'staking' && (event.method === 'Reward' || event.method === 'Rewarded')) {
      // TODO: also store validator and era index
      sql = `INSERT INTO staking_reward (
        block_number,
        event_index,
        account_id,
        amount,
        timestamp
      ) VALUES (
        '${blockNumber}',
        '${index}',
        '${event.data[0]}',
        '${new BigNumber(event.data[1]).toString(10)}',
        '${timestamp}'
      )
      ON CONFLICT ON CONSTRAINT staking_reward_pkey 
      DO NOTHING
      ;`;
      try {
        await client.query(sql);
        logger.debug(loggerOptions, `Added staking reward #${blockNumber}-${index} ${event.section} ➡ ${event.method}`);
      } catch (error) {
        logger.error(loggerOptions, `Error adding staking reward #${blockNumber}-${index}: ${error}, sql: ${sql}`);
      }
    }
    // Store staking slash
    if (event.section === 'staking' && (event.method === 'Slash' || event.method === 'Slashed')) {
      // TODO: also store validator and era index
      sql = `INSERT INTO staking_slash (
        block_number,
        event_index,
        account_id,
        amount,
        timestamp
      ) VALUES (
        '${blockNumber}',
        '${index}',
        '${event.data[0]}',
        '${new BigNumber(event.data[1]).toString(10)}',
        '${timestamp}'
      )
      ON CONFLICT ON CONSTRAINT staking_slash_pkey 
      DO NOTHING
      ;`;
      try {
        await client.query(sql);
        logger.debug(loggerOptions, `Added staking slash #${blockNumber}-${index} ${event.section} ➡ ${event.method}`);
      } catch (error) {
        logger.error(loggerOptions, `Error adding staking slash #${blockNumber}-${index}: ${error}, sql: ${sql}`);
      }
    }
    // Update account evm address
    if (event.section === 'evmAccounts' && event.method === 'ClaimAccount') {
      const accountId = event.data[0];
      const evmAddress = event.data[1];
      const query = 'UPDATE account SET evm_address = $1 WHERE account_id = $2;';
      // eslint-disable-next-line no-await-in-loop
      await module.exports.dbParamQuery(client, query, [evmAddress, accountId], loggerOptions);
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
    return blockEvents
      .find(({ event, phase }) => (
        (phase.toJSON()?.ApplyExtrinsic === index || phase.toJSON()?.applyExtrinsic === index)
          && event.section === 'system'
          && event.method === 'ExtrinsicSuccess'
      )) ? true : false;
  },
  getExtrinsicError: (index, blockEvents) => JSON.stringify(
    blockEvents
      .find(({ event, phase }) => (
        (phase.toJSON()?.ApplyExtrinsic === index || phase.toJSON()?.applyExtrinsic === index)
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
      error.stack,
      timestamp,
    ];
    const query = `
      INSERT INTO
        harvest_error (block_number, error, stack, timestamp)
      VALUES
        ($1, $2, $3, $4)
      ON CONFLICT ON CONSTRAINT
        harvest_error_pkey 
        DO NOTHING
      ;`;
    await module.exports.dbParamQuery(client, query, data, loggerOptions);
  },
  async updateTokenHolders(client, provider, contractId, contractAbi, accounts, blockHeight, timestamp, loggerOptions) {
    const contract = new ethers.Contract(
      contractId,
      contractAbi,
      provider,
    );
    // eslint-disable-next-line no-restricted-syntax
    for (const account of accounts.rows) {
      let balance = 0;
      try {
        // eslint-disable-next-line no-await-in-loop
        balance = await contract.balanceOf(account.evm_address);
      } catch(error) {
        logger.error(loggerOptions, `Error getting balances for address ${account.evm_address} and contract ${contractId}: ${JSON.stringify(error)}`);
      }
      if (balance > 0) {
        // eslint-disable-next-line no-console
        logger.info(loggerOptions, `Holder: ${account.evm_address} (${balance})`);
        // Update token_holder table
        const data = [
          contractId,
          account.account_id,
          account.evm_address,
          balance.toString(),
          blockHeight,
          timestamp,
        ];
        const query = `
          INSERT INTO token_holder (
            contract_id,
            holder_account_id,
            holder_evm_address,
            balance,
            block_height,
            timestamp
          ) VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )
          ON CONFLICT ( contract_id, holder_evm_address )
          DO UPDATE SET
            balance = EXCLUDED.balance,
            block_height = EXCLUDED.block_height,
            timestamp = EXCLUDED.timestamp
          WHERE EXCLUDED.block_height > token_holder.block_height
        ;`;
        // eslint-disable-next-line no-await-in-loop
        await module.exports.dbParamQuery(client, query, data, loggerOptions);
      } else {
        // Ensure there's no entry in token_holder
        const data = [
          contractId,
          account.evm_address,
        ];
        const query = 'DELETE FROM token_holder WHERE contract_id = $1 AND holder_evm_address = $2;';
        // eslint-disable-next-line no-await-in-loop
        await module.exports.dbParamQuery(client, query, data, loggerOptions);
      }
    }
  },
  getContractMetadataAndArguments(deploymentBytecode, runtimeBytecode) {

    // remove 0x
    const processedRuntimeBytecode = runtimeBytecode.slice(2);

    // get constructor arguments
    const argumentsStart = deploymentBytecode.indexOf(processedRuntimeBytecode) + processedRuntimeBytecode.length;
    const contractArguments = deploymentBytecode.slice(argumentsStart);

    //
    // get metadata
    //
    // metadata is part of runtime bytecode
    //
    let contractMetadata = '';

    // metadata separator for 0.5.16
    const bzzr1MetadataStartBytes = 'a265627a7a72315820';
    // metadata separator (solc >= v0.6.0)
    const ipfsMetadataStartBytes =  'a264697066735822';

    if (runtimeBytecode.indexOf(ipfsMetadataStartBytes) > 0) {
      const ipfsMetadataStart = runtimeBytecode.indexOf(ipfsMetadataStartBytes);
      contractMetadata = runtimeBytecode.slice(ipfsMetadataStart);
    } else if (runtimeBytecode.indexOf(bzzr1MetadataStartBytes) > 0) {
      const bzzr1MetadataStart = runtimeBytecode.indexOf(bzzr1MetadataStartBytes);
      contractMetadata = runtimeBytecode.slice(bzzr1MetadataStart);
    }

    return {
      contractMetadata,
      contractArguments,
    }
  },
  getContractRuntimeBytecode: async (provider, contractId, loggerOptions) => {
    try {
      const { contractInfo: { codeHash } } = await provider.api.query.evm.accounts(contractId)
        .then((res) => res.toJSON());
      return await provider.api.query.evm.codes(codeHash).then((res) => res.toString());
    } catch (error) {
      logger.error(loggerOptions, `Error retrieving contract runtime bytecode from chain: ${error}`);
    }
    return null;
  },
  chunker: (a, n) => Array.from(
    { length: Math.ceil(a.length / n) },
    (_, i) => a.slice(i * n, i * n + n),
  )
}
