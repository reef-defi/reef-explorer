// @ts-check
let solc = require("solc");
const pino = require('pino');
const logger = pino();
const { Pool } = require('pg');
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

const getPool = async () => {
  const pool = new Pool(postgresConnParams);
  await pool.connect();
  return pool;
};

const parametrizedDbQuery = async (pool, query, data) => {
  try {
    return await pool.query(query, data);
  } catch (error) {
    logger.error(loggerOptions, `Db error: ${error}`);
    return false;
  }
};

const getPendingRequests = async (pool) => {
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
    const res = await pool.query(query);
    return res.rows || [];
  } catch (error) {
    logger.error(loggerOptions, `Db error: ${error}`);
    return [];
  }
};

const updateRequestStatus = async (pool, id, status) => {
  logger.info({ request: id }, `Updating request status to ${status}`);
  await parametrizedDbQuery(
    pool,
    `UPDATE contract_verification_request SET status = $1 WHERE id = $2;`,
    [status, id]
  );
};

const updateRequestError = async (pool, id, errorType, errorMessage) => {
  logger.info({ request: id }, `Updating error type to '${errorType}' and error message to ${errorMessage}`);
  await parametrizedDbQuery(
    pool,
    `UPDATE contract_verification_request SET error_type = $1, error_message = $2 WHERE id = $3;`,
    [errorType, errorMessage, id]
  );
};

const getOnChainContractBytecode = async (pool, contract_id) => {
  const query = `SELECT bytecode FROM contract WHERE contract_id = $1;`;
  const data = [contract_id];
  const res = await parametrizedDbQuery(pool, query, data);
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
  const start = bytecode.lastIndexOf('6080604052');
  const end = bytecode.lastIndexOf('a2646970667358221220');
  return bytecode.slice(start, end)
};

const checkIfContractMatch = (bytecode, existing) => {
  const core = preprocessBytecode(bytecode);
  return core === existing;
};

const prepareSolcContracts = (contracts) => ({
  language: 'Solidity',
  sources: {...contracts},
  settings: {
    outputSelection: {
      '*': {
        '*': ['*']
      }
    }
  }
});

const prepareOptimizedSolcContracts = (contracts, runs, evmVersion) => ({
  language: 'Solidity',
  sources: {...contracts},
  settings: {
    optimizer: {
      enabled: true,
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
    logger.info(loggerOptions, `Contract is not verified, compilation error: ${JSON.stringify(error)}`);
    return {
      error: true,
      message: JSON.stringify(error)
    };
  }
};

const processVerificationRequest = async (request, pool) => {
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
    const onChainContractBytecode = await getOnChainContractBytecode(pool, contract_id);
    const existing = preprocessBytecode(onChainContractBytecode);
    const compiler = await loadCompiler(compiler_version);
    const contracts = [];
    contracts[filename] = { content: source };

    const artifacts = await getContractArtifacts(
      compiler,
      filename,
      existing,
      optimization ? prepareOptimizedSolcContracts(contracts, runs, target) : prepareSolcContracts(contracts)
    );

    if (artifacts?.error) {
      await updateRequestStatus(pool, id, 'ERROR');
      await updateRequestError(pool, id, 'COMPILATION_ERROR', artifacts.error);
      return;
    }
    const { isVerified, contractName, contractAbi, contractBytecode } = artifacts;

    if (isVerified) {
      logger.info({ request: id }, `Contract ${contract_id} is verified!`);
      await updateRequestStatus(pool, id, 'VERIFIED');
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
      await parametrizedDbQuery(pool, query, data);
    } else {
      const bytecodes = JSON.stringify({
        request: contractBytecode,
        onchain: existing,
      });
      await updateRequestStatus(pool, id, 'ERROR');
      await updateRequestError(pool, id, 'BYTECODE_MISMATCH', bytecodes);
      logger.info({ request: id }, `Contract is not verified, bytecode mismatch: ${bytecodes}`);
    }
    
    // TODO: delete request older than 1 week

  } catch (error) {
    logger.error(loggerOptions, `Error: ${error}`);
  }
};

const main = async () => {
  logger.info(loggerOptions, `Starting contract verificator`);
  logger.info(loggerOptions, `Connecting to db`);
  const pool = await getPool();
  logger.info(loggerOptions, `Getting pending requests`);
  const pendingRequests = await getPendingRequests(pool);
  for (const request of pendingRequests) {
    await processVerificationRequest(request, pool);
  }
  logger.info(loggerOptions, `Disconnecting from db`);
  pool.end();
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
