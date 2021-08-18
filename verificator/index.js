// @ts-check
let solc = require("solc");
const pino = require('pino');
const logger = pino();
const { Client } = require('pg');
require('dotenv').config();
const loggerOptions = {};

// Configuration
const pollingTime = 30 * 1000; // 30 seconds
const postgresConnParams = {
  user: process.env.POSTGRES_USER || 'reef',
  host: process.env.POSTGRES_HOST || 'postgres',
  database: process.env.POSTGRES_DATABASE || 'reef',
  password: process.env.POSTGRES_PASSWORD || 'reef',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
};

const getClient = async () => {
  const client = new Client(postgresConnParams);
  await client.connect();
  return client;
};

const parametrizedDbQuery = async (client, query, data) => {
  try {
    return await client.query(query, data);
  } catch (error) {
    logger.error(loggerOptions, `Db error: ${error}`);
    return false;
  }
};

const getPendingRequests = async (client) => {
  try {
    const query = `
      SELECT
        id,
        contract_id,
        source,
        filename,
        compiler_version,
        optimization,
        runs,
        target,
        license
      FROM contract_verification_request
      WHERE status = 'PENDING'
      ;`;
    const res = await client.query(query);
    return res.rows || [];
  } catch (error) {
    logger.error(loggerOptions, `Db error: ${error}`);
    return [];
  }
};

const updateRequestStatus = async (client, id, status) => {
  logger.info({ request: id }, `Updating request status to '${status}'`);
  await parametrizedDbQuery(
    client,
    `UPDATE contract_verification_request SET status = $1 WHERE id = $2;`,
    [status, id]
  );
};

const updateRequestError = async (client, id, errorType, errorMessage) => {
  logger.info({ request: id }, `Updating error type to '${errorType}'`);
  await parametrizedDbQuery(
    client,
    `UPDATE contract_verification_request SET error_type = $1, error_message = $2 WHERE id = $3;`,
    [errorType, errorMessage, id]
  );
};

const getOnChainContractBytecode = async (client, contract_id) => {
  const query = `SELECT bytecode FROM contract WHERE contract_id = $1;`;
  const data = [contract_id];
  const res = await parametrizedDbQuery(client, query, data);
  if (res) {
    if (res.rows.length > 0) {
      return res.rows[0].bytecode;
    }
  }
  return '';
};

const loadCompiler = async (version) => (
  new Promise((resolve, reject) => {
    solc.loadRemoteVersion(version, (err, solcSnapshot) => {
      err ? reject(err) : resolve(solcSnapshot);
    });
  })
);

const preprocessBytecode = (bytecode) => {
  //
  // TODO: verify that start is the same from solc >= 0.6.0
  //
  let filteredBytecode = "";
  const start = bytecode.indexOf('6080604052');
  //
  // ipfs and solc metadata separators (solc >= v0.6.0)
  //
  const ipfsMetadataEnd = bytecode.lastIndexOf('a26469706673582200');
  filteredBytecode = bytecode.slice(start, ipfsMetadataEnd);

  const solcMetadataEnd = filteredBytecode.lastIndexOf('a264736f6c634300');
  filteredBytecode = filteredBytecode.slice(0, solcMetadataEnd);
  //
  // metadata separator for 0.5.16
  //
  const bzzr1MetadataEnd = filteredBytecode.lastIndexOf('a265627a7a72315820');
  filteredBytecode = filteredBytecode.slice(0, bzzr1MetadataEnd);

  return filteredBytecode;
};

const checkIfContractMatch = (bytecode, existing) => {
  const core = preprocessBytecode(bytecode);
  return core === existing;
};

const prepareSolcContracts = (contracts, optimization, runs, evmVersion) => ({
  language: 'Solidity',
  sources: {...contracts},
  settings: {
    optimizer: {
      enabled: optimization,
      runs
    },
    evmVersion,
    outputSelection: {
      '*': {
        '*': ['*']
      }
    }
  }
});

const getContractArtifacts = async (compiler, filename, existingBytecode, inputs) => {
  try {
    const contracts = JSON.parse(compiler.compile(JSON.stringify(inputs)));

    // debug
    logger.info(loggerOptions, `compiler output (first 255 chars): ${JSON.stringify(contracts).substr(0,255)}...`);

    // filename excluding the extension should be equal to contract name in source code
    const contractName = filename.split('.')[0];
    const contractAbi = contracts.contracts[filename][contractName].abi;
    const contractBytecode = contracts.contracts[filename][contractName].evm.bytecode.object;
    const isVerified = checkIfContractMatch(contractBytecode, existingBytecode);
    const result = {
      isVerified,
      contractName,
      contractAbi,
      contractBytecode,
    };
    return result;
  } catch (error) {
    logger.info(loggerOptions, `compiler error: ${JSON.stringify(error)}`);
    return {
      error: true,
      message: JSON.stringify(error)
    };
  }
};

const stringMatch = (a, b) => {
  let equivalency = 0;
  let minLength = (a.length > b.length) ? b.length : a.length;    
  let maxLength = (a.length < b.length) ? b.length : a.length;    
  for (let i = 0; i < minLength; i++) {
    if (a[i] == b[i]) {
      equivalency++;
    }
  }
  let weight = equivalency / maxLength;
  return (weight * 100);
}

const processVerificationRequest = async (request, client) => {
  try {
    const {
      id,
      contract_id,
      source,
      filename,
      compiler_version,
      optimization,
      runs,
      target,
      license
    } = request
    logger.info({ request: id }, `Processing contract verification request for contract ${contract_id}`);
    const onChainContractBytecode = await getOnChainContractBytecode(client, contract_id);

    // debug
    logger.info({ request: id }, `onChainContractBytecode: ${onChainContractBytecode}`);

    const existing = preprocessBytecode(onChainContractBytecode);

    // debug
    logger.info({ request: id }, `existing: ${existing}`);

    const compiler = await loadCompiler(compiler_version);
    const contracts = [];
    contracts[filename] = { content: source };

    // debug
    logger.info({ request: id }, `filename: ${filename}`);
    logger.info({ request: id }, `compiler_version: ${compiler_version}`);
    logger.info({ request: id }, `optimization: ${optimization}`);
    logger.info({ request: id }, `runs: ${runs}`);
    logger.info({ request: id }, `target: ${target}`);
    logger.info({ request: id }, `license: ${license}`);

    const artifacts = await getContractArtifacts(
      compiler,
      filename,
      existing,
      prepareSolcContracts(contracts, optimization, runs, target)
    );

    if (artifacts?.error) {
      logger.info({ request: id }, `Contract is not verified, compilation error: ${artifacts?.message}`);
      await updateRequestStatus(client, id, 'ERROR');
      await updateRequestError(client, id, 'COMPILATION_ERROR', artifacts.error);
      return;
    }
    const { isVerified, contractName, contractAbi, contractBytecode } = artifacts;

    if (isVerified) {
      logger.info({ request: id }, `Contract ${contract_id} is verified!`);
      await updateRequestStatus(client, id, 'VERIFIED');
      logger.info({ request: id }, `Updating contract ${contract_id} data in db`);
      const query = `UPDATE contract SET
        name = $1,
        verified = $2,
        source = $3,
        compiler_version = $4,
        optimization = $5,
        runs = $6,
        target = $7,
        abi = $8,
        license = $9
        WHERE contract_id = $10;
      `;
      const data = [
        contractName,
        isVerified,
        source,
        compiler_version,
        optimization,
        runs,
        target,
        JSON.stringify(contractAbi),
        license,
        contract_id
      ];
      await parametrizedDbQuery(client, query, data);
    } else {
      const bytecodes = JSON.stringify({
        request: contractBytecode,
        onchain: existing,
      });

      const matchPercentaje = stringMatch(contractBytecode, existing)
      await updateRequestStatus(client, id, 'ERROR');
      await updateRequestError(client, id, 'BYTECODE_MISMATCH', bytecodes);
      logger.info({ request: id }, `Contract is not verified, bytecode mismatch (${matchPercentaje}%)`);
    }
    
    // TODO: delete request older than 1 week

  } catch (error) {
    logger.error(loggerOptions, `Error: ${error}`);
  }
};

const main = async () => {
  logger.info(loggerOptions, `Starting contract verificator`);
  logger.info(loggerOptions, `Connecting to db`);
  const client = await getClient();
  logger.info(loggerOptions, `Processing pending requests`);
  const pendingRequests = await getPendingRequests(client);
  for (const request of pendingRequests) {
    await processVerificationRequest(request, client);
  }
  logger.info(loggerOptions, `Disconnecting from db`);
  await client.end();
  logger.info(loggerOptions, `Contract verificator finished, sleeping ${pollingTime / 1000}s`);
  setTimeout(
    () => main(),
    pollingTime,
  );
};

main().catch((error) => {
  logger.error(loggerOptions, `Main error: ${error}`);
  logger.error(loggerOptions, `Contract verificator stopped!`);
});
