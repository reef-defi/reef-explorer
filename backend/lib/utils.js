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
const genesisContracts = require('../assets/bytecodes.json');
const erc20Abi = require('../assets/erc20Abi.json');

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
    const index = indexedExtrinsic[0];
    const extrinsic = indexedExtrinsic[1];
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
          name,
          deploymentBytecode,
          bytecode,
          contractMetadata,
          contractArguments,
          value,
          gasLimit,
          storageLimit,
          signer,
          blockNumber,
          timestamp
        ];
        const contractSql = `INSERT INTO contract (
            contract_id,
            name,
            deployment_bytecode,
            bytecode,
            metadata,
            arguments,
            value,
            gas_limit,
            storage_limit,
            signer,
            block_height,
            timestamp
          ) VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12
          )
          ON CONFLICT ON CONSTRAINT contract_pkey 
          DO UPDATE SET
            metadata = EXCLUDED.metadata,
            arguments = EXCLUDED.arguments,
            deployment_bytecode = EXCLUDED.deployment_bytecode,
            bytecode = EXCLUDED.bytecode;`;
        try {
          await client.query(contractSql, data);
          logger.info(loggerOptions, `Added contract ${contractId} at block #${blockNumber}`);
        } catch (error) {
          logger.error(loggerOptions, `Error adding contract ${contractId} at block #${blockNumber}: ${JSON.stringify(error)}`);
        }
        //
        // - check & verify directly by matching bytecode with already verified contracts
        // - check ERC-20 interface and set token data/holders if contract is an ERC-20 token
        //
        module.exports.processNewContract(client, provider, contractId, bytecode.toString(), loggerOptions);
      }
      // update token_holder table if needed
      if (section === 'evm' && method === 'call' && success) {
        // contract is ERC-20 token?
        // TODO: Another possible check: contract call method is transfer or transferFrom
        const contractId = extrinsic.args[0];
        const query = `SELECT is_erc20, abi FROM contract WHERE contract_id = $1 AND verified IS TRUE AND is_erc20 IS TRUE;`;
        const res = await module.exports.dbParamQuery(client, query, [contractId], loggerOptions);
        if (res.rows.length > 0) {
          const contractAbi = JSON.parse(res.rows[0].abi);
          // Get all claimed evm addresses and their associated account id
          const accountsQuery = 'SELECT account_id, evm_address FROM account WHERE evm_address != \'\';';
          const accounts = await module.exports.dbQuery(client, accountsQuery, loggerOptions);
          const [
            { block },
            timestampMs,
          ] = await Promise.all([
            provider.api.rpc.chain.getBlock(),
            provider.api.query.timestamp.now(),
          ]);
          const timestamp = Math.floor(parseInt(timestampMs.toString(), 10) / 1000);
          const blockHeight = block.header.number.toString();
          await module.exports.updateTokenHolders(client, provider, contractId, contractAbi, accounts, blockHeight, timestamp, loggerOptions);
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
    const index = indexedEvent[0];
    const record = indexedEvent[1];
    const { event, phase } = record;
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
  async storeGenesisContracts(provider, client, loggerOptions) {
    // Get timestamp from block #1, genesis doesn't return timestamp
    const blockHash = await provider.api.rpc.chain.getBlockHash(1);
    const timestampMs = await provider.api.query.timestamp.now.at(blockHash);
    const timestamp = Math.floor(parseInt(timestampMs.toString(), 10) / 1000);
    // eslint-disable-next-line no-restricted-syntax
    for (const contract of genesisContracts) {
      const blockNumber = 0;
      const signer = '';
      const name = contract[0];
      const contractId = contract[1];
      const deploymentBytecode = await module.exports.getContractRuntimeBytecode(provider, contractId, loggerOptions);
      const bytecode = contract[2];

      // get metadata and arguments
      const { contractMetadata, contractArguments } = module.exports.getContractMetadataAndArguments(deploymentBytecode, bytecode);

      const value = '';
      const gasLimit = '';
      const storageLimit = '';
      let contractSql = '';
      let data = [];

      //
      //   REEF ERC20
      //
      // - totalSupply() is virtual, it just reflects on chain REEF supply
      // - token holders will be added first time tokenHolders.js executes
      // - token holders are updated in every REEF contract call, just like others erc20 contracts
      //
      if (name === 'REEF') {
        const isErc20 = true;
        const tokenName = name;
        const tokenSymbol = name;
        const tokenDecimals = 18;
        const tokenTotalSupply = null;
        contractSql = `INSERT INTO contract (
            contract_id,
            name,
            deployment_bytecode,
            bytecode,
            metadata,
            arguments,
            value,
            gas_limit,
            storage_limit,
            signer,
            block_height,
            is_erc20,
            token_name,
            token_symbol,
            token_decimals,
            token_total_supply,
            timestamp
          ) VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            $16,
            $17
          )
          ON CONFLICT ON CONSTRAINT contract_pkey
          DO UPDATE SET
            name = EXCLUDED.name,
            is_erc20 = EXCLUDED.is_erc20,
            token_name = EXCLUDED.token_name,
            token_symbol = EXCLUDED.token_symbol,
            token_decimals = EXCLUDED.token_decimals,
            token_total_supply = EXCLUDED.token_total_supply,
            deployment_bytecode = EXCLUDED.deployment_bytecode,
            bytecode = EXCLUDED.bytecode,
            metadata = EXCLUDED.metadata,
            arguments = EXCLUDED.arguments
        ;`;
        data = [
          contractId,
          name,
          deploymentBytecode,
          bytecode,
          contractMetadata,
          contractArguments,
          value,
          gasLimit,
          storageLimit,
          signer,
          blockNumber,
          isErc20,
          tokenName,
          tokenSymbol,
          tokenDecimals,
          tokenTotalSupply,
          timestamp,
        ];
      } else {
        contractSql = `INSERT INTO contract (
            contract_id,
            name,
            deployment_bytecode,
            bytecode,
            metadata,
            arguments,
            value,
            gas_limit,
            storage_limit,
            signer,
            block_height,
            timestamp
          ) VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12
          )
          ON CONFLICT ON CONSTRAINT contract_pkey
          DO UPDATE SET
            name = EXCLUDED.name,
            deployment_bytecode = EXCLUDED.deployment_bytecode,
            bytecode = EXCLUDED.bytecode,
            metadata = EXCLUDED.metadata,
            arguments = EXCLUDED.arguments
        ;`;
        data = [
          contractId,
          name,
          deploymentBytecode,
          bytecode,
          contractMetadata,
          contractArguments,
          value,
          gasLimit,
          storageLimit,
          signer,
          blockNumber,
          timestamp,
        ];
      }
      try {
        // eslint-disable-next-line no-await-in-loop
        await client.query(contractSql, data);
        // @ts-ignore
        logger.info(loggerOptions, `Added contract ${name} with address ${contractId} at block #${blockNumber}`);
      } catch (error) {
        logger.error(loggerOptions, `Error adding contract ${name} with address ${contractId} at block #${blockNumber}: ${JSON.stringify(error)}`);
      }
    }
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
  async processNewContract(client, provider, contractId, bytecode, loggerOptions) {
    // dont match dummy contracts
    if (bytecode !== '0x') {
      // find verified contract with the same preprocesses bytecode
      const query = "SELECT name, source, compiler_version, optimization, runs, target, abi, license FROM contract WHERE verified IS TRUE AND contract_id != $1 AND deployment_bytecode LIKE $2 LIMIT 1;";
      const preprocessedRequestContractBytecode = module.exports.preprocessBytecode(bytecode);
      const dbres = await client.query(
        query,
        [
          contractId,
          `0x${preprocessedRequestContractBytecode}%`
        ]
      );
      if (dbres) {
        if (dbres.rows.length === 1) {
          // verify new contract using same compilation data
          const isVerified = true;
          // TODO: extract contract arguments
          const args = '';
          const {
            name,
            source,
            compilerVersion,
            optimization,
            runs,
            target,
            abi,
            license
          } = dbres.rows[0];

          // check if it's an ERC-20 token
          const {
            isErc20,
            tokenName,
            tokenSymbol,
            tokenDecimals,
            tokenTotalSupply
          } = await module.exports.isErc20Token(contractId, provider);
          
          const query = `UPDATE contract SET
            name = $1,
            verified = $2,
            source = $3,
            compiler_version = $4,
            arguments = $5,
            optimization = $6,
            runs = $7,
            target = $8,
            abi = $9,
            license = $10,
            is_erc20 = $11,
            token_name = $12,
            token_symbol = $13,
            token_decimals = $14,
            token_total_supply = $15
            WHERE contract_id = $16;
          `;
          const data = [
            name,
            isVerified,
            source,
            compilerVersion,
            args,
            optimization,
            runs,
            target,
            abi,
            license,
            isErc20,
            tokenName ? tokenName.toString() : null,
            tokenSymbol ? tokenSymbol.toString() : null,
            tokenDecimals ? tokenDecimals.toString(): null,
            tokenTotalSupply ? tokenTotalSupply.toString() : null,
            contractId
          ];
          await module.exports.dbParamQuery(client, query, data, loggerOptions);
          if (isErc20) {
            // contract IS an ERC-20 token, update token holders
            const accountsQuery = 'SELECT account_id, evm_address FROM account WHERE evm_address != \'\';';
            const accounts = await module.exports.dbQuery(client, accountsQuery, loggerOptions);
            const [
              { block },
              timestampMs,
            ] = await Promise.all([
              provider.api.rpc.chain.getBlock(),
              provider.api.query.timestamp.now(),
            ]);
            const timestamp = Math.floor(parseInt(timestampMs.toString(), 10) / 1000);
            const blockHeight = block.header.number.toString();
            await module.exports.updateTokenHolders(client, provider, contractId, abi, accounts, blockHeight, timestamp, loggerOptions);
          }
        } else {
          // contract is not verified but let's check if it's an ERC-20 token
          const {
            isErc20,
            tokenName,
            tokenSymbol,
            tokenDecimals,
            tokenTotalSupply
          } = await module.exports.isErc20Token(contractId, provider);
          if (isErc20) {
            // contract IS an ERC-20 token!
            const query = `
              UPDATE
                contract
              SET
                is_erc20 = $1,
                token_name = $2,
                token_symbol = $3,
                token_decimals = $4,
                token_total_supply = $5
              WHERE
                contract_id = $6;
            `;
            const data = [
              isErc20,
              tokenName ? tokenName.toString() : null,
              tokenSymbol ? tokenSymbol.toString() : null,
              tokenDecimals ? tokenDecimals.toString(): null,
              tokenTotalSupply ? tokenTotalSupply.toString() : null,
              contractId
            ];
            await module.exports.dbParamQuery(client, query, data, loggerOptions);

            // update token holders
            const accountsQuery = 'SELECT account_id, evm_address FROM account WHERE evm_address != \'\';';
            const accounts = await module.exports.dbQuery(client, accountsQuery, loggerOptions);
            const [
              { block },
              timestampMs,
            ] = await Promise.all([
              provider.api.rpc.chain.getBlock(),
              provider.api.query.timestamp.now(),
            ]);
            const timestamp = Math.floor(parseInt(timestampMs.toString(), 10) / 1000);
            const blockHeight = block.header.number.toString();
            await module.exports.updateTokenHolders(client, provider, contractId, erc20Abi, accounts, blockHeight, timestamp, loggerOptions);
          }
        }
      }
    }
  },
  preprocessBytecode(bytecode) {
    let filteredBytecode = "";
    const start = bytecode.indexOf('6080604052');
    //
    // metadata separator (solc >= v0.6.0)
    //
    const ipfsMetadataEnd = bytecode.indexOf('a264697066735822');
    filteredBytecode = bytecode.slice(start, ipfsMetadataEnd);
  
    //
    // metadata separator for 0.5.16
    //
    const bzzr1MetadataEnd = filteredBytecode.indexOf('a265627a7a72315820');
    filteredBytecode = filteredBytecode.slice(0, bzzr1MetadataEnd);
  
    return filteredBytecode;
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
  async isErc20Token(contractId, provider) {
    //
    // check standard ERC20 interface: https://ethereum.org/en/developers/docs/standards/tokens/erc-20/ 
    //
    // function name() public view returns (string)
    // function symbol() public view returns (string)
    // function decimals() public view returns (uint8)
    // function totalSupply() public view returns (uint256)
    // function balanceOf(address _owner) public view returns (uint256 balance)
    // function transfer(address _to, uint256 _value) public returns (bool success)
    // function transferFrom(address _from, address _to, uint256 _value) public returns (bool success)
    // function approve(address _spender, uint256 _value) public returns (bool success)
    // function allowance(address _owner, address _spender) public view returns (uint256 remaining)
    //
    let isErc20 = false;
    let tokenName = null;
    let tokenSymbol = null;
    let tokenDecimals = null;
    let tokenTotalSupply = null;

    try {
      const contract = new ethers.Contract(
        contractId,
        erc20Abi,
        provider
      )
      if (
        typeof contract['name'] === 'function'
        && typeof contract['symbol'] === 'function'
        && typeof contract['decimals'] === 'function'
        && typeof contract['totalSupply'] === 'function'
        && typeof contract['balanceOf'] === 'function'
        && typeof contract['transfer'] === 'function'
        && typeof contract['transferFrom'] === 'function'
        && typeof contract['approve'] === 'function'
        && typeof contract['allowance'] === 'function'
        && await contract.balanceOf('0x0000000000000000000000000000000000000000')
      ) {
        isErc20 = true;
        tokenName = await contract.name();
        tokenSymbol = await contract.symbol();
        tokenDecimals = await contract.decimals();
        tokenTotalSupply = await contract.totalSupply();
      }
    } catch (error) {
      // logger.error(loggerOptions, `Error detecting erc20 contract ${contractId}: ${JSON.stringify(error)}`);
    }
    return {
      isErc20,
      tokenName,
      tokenSymbol,
      tokenDecimals,
      tokenTotalSupply
    }
  },
  updateReefContractTotalSupply: async (client, totalIssuance, loggerOptions) => {
    const sql = `
      UPDATE contract SET token_total_supply = $1 WHERE contract_id = $2;
    `;
    const data = [
      totalIssuance.toString(),
      '0x0000000000000000000000000000000001000000'
    ];
    try {
      await client.query(sql, data);
    } catch (error) {
      logger.error(loggerOptions, `Error updating REEF contract total supply: ${error}`);
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
