const fetch = require('node-fetch');
let solc = require("solc");
const pino = require('pino');
const logger = pino();
const { Pool } = require('pg');
const { license } = require('solc');
const postgresConnParams = {
  user: process.env.POSTGRES_USER || 'reef',
  host: process.env.POSTGRES_HOST || 'postgres',
  database: process.env.POSTGRES_DATABASE || 'reef',
  password: process.env.POSTGRES_PASSWORD || 'reef',
  port: process.env.POSTGRES_PORT || 5432,
};

const loggerOptions = {};

// Configuration
const nodeRpc = 'https://testnet.reefscan.com/api/v3';
const contractName = 'Storage';
const pollingTime = 60 * 1000; // 1min

const getPool = async () => {
  const pool = new Pool(postgresConnParams);
  await pool.connect();
  return pool;
}

const getPendingRequests = async () => {
  const query = `
    query contract_verification_request {
      contract_verification_request(where: { status: { _eq: "PENDING" } }) {
        id,
        contract_id,
        source,
        filename,
        compiler_version,
        optimization,
        runs,
        target
      }
    }`;
  const response = await fetch(nodeRpc, {method: 'POST', body: JSON.stringify({query})});
  const { data } = await response.json();
  return data.contract_verification_request;
}

const getOnChainContractBytecode = async (contract_id) => {
  const query = `
    query contract {
      contract(where: { contract_id: { _eq: "${contract_id}" } }) {
        bytecode
      }
    }`;
  const response = await fetch(nodeRpc, {method: 'POST', body: JSON.stringify({query})});
  const { data } = await response.json();
  return data.contract[0].bytecode || '';
}

const loadCompiler = async (version) => (
  new Promise((resolve, reject) => {
    solc.loadRemoteVersion(version, (err, solcSnapshot) => {
      err ? reject(err) : resolve(solcSnapshot);
    });
  })
)

const preprocessBytecode = async (bytecode) => {
  const start = bytecode.lastIndexOf('6080604052');
  const end = bytecode.lastIndexOf('a2646970667358221220');
  return bytecode.slice(start, end)
}

const checkIfContractExists = async (bytecode, existing) => {
  const core = await preprocessBytecode(bytecode);
  const result = existing.find(([name, contract]) => contract === core);
  return result !== undefined;
}

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

const preprocessExistingBytecodes = async (bytecodes) => 
  await Promise.all(
    bytecodes.map(async ([name, code]) => [name, await preprocessBytecode(code)]));

const findBytecode = async (compiler, filename, existingBytecodes, inputs) => {
  const contracts = JSON.parse(compiler.compile(JSON.stringify(inputs)));
  const bytecode = contracts.contracts[filename][contractName].evm.bytecode.object;
  return await checkIfContractExists(bytecode, existingBytecodes)
}

const verify = async (request, pool) => {
  try {
    const {
      id,
      contract_id,
      source,
      filename,
      compiler_version,
      optimization,
      runs,
      target
    } = request
    logger.info({ request: id }, `Processing contract verification request for contract ${contract_id}`);
    const onChainContractBytecode = await getOnChainContractBytecode(contract_id);
    const existingBytecodes = [['', onChainContractBytecode]];
    const existing = await preprocessExistingBytecodes(existingBytecodes);
    const compiler = await loadCompiler(compiler_version);
    const contracts = [];
    contracts[filename] = { content: source } 
    
    const normalResult = await findBytecode(
      compiler,
      filename,
      existing,
      prepareSolcContracts(contracts)
    );
    const optimizedResult = await findBytecode(
      compiler,
      filename,
      existing,
      prepareOptimizedSolcContracts(contracts, runs, target)
    );

    const isVerified = normalResult || optimizedResult;
    logger.info({ request: id }, `Contract ${contract_id} is ${isVerified ? "verified" : "not verified"}`);

    if (isVerified) {
      // Update request status
      logger.info({ request: id }, `Updating request status`);
      let sql = `UPDATE contract_verification_request SET status = 'VERIFIED' WHERE id = '${id}';`;
      try {
        await pool.query(sql);
      } catch (error) {
        logger.info({ request: id }, `Error: ${error}`);
      }
      
      // TODO: extract abi after compilation process
      const abi = '';
      
      // Insert source code, name, abi, etc in contract and set contract verified = true
      logger.info({ request: id }, `Updating verified contract ${contract_id}`);
      sql = `UPDATE contract SET
        name = $1,
        verified = $2,
        source = $3,
        compiler_version = $4,
        optimization = $5,
        runs = $6,
        target = $7,
        abi = $8,
        license = $9,
        WHERE contract_id = $10;
      `;
      const data = [
        contractName, // TODO: get contract name from compilation process
        isVerified,
        source,
        compiler_version,
        optimization,
        runs,
        target,
        abi,
        license,
        contract_id
      ];
      try {
        await pool.query(sql, data);
      } catch (error) {
        logger.info({ request: id }, `Db error: ${error}`);
      }

    } else {
      // Update request status
      logger.info({ request: id }, `Updating request status`);
      const sql = `UPDATE contract_verification_request SET status = 'ERROR' WHERE id = '${id}';`;
      try {
        await pool.query(sql);
      } catch (error) {
        logger.info({ request: id }, `Db error: ${error}`);
      }
    }

    // TODO: delete request older than 1 week

  } catch (e) {
    logger.error({ request: id }, `Error: ${error}`);
  }
}

const main = async () => {
  logger.info(loggerOptions, `Starting contract verificator`);

  logger.info(loggerOptions, `Connecting to db`);
  const pool = await getPool();

  logger.info(loggerOptions, `Getting pending requests`);
  const pendingRequests = await getPendingRequests();
  for (request of pendingRequests) {
    await verify(request, pool);
  }

  logger.info(loggerOptions, `Disconnecting from db`);
  pool.end();

  logger.info(loggerOptions, `Contract verificator finished, sleeping 1min`);

  setTimeout(
    () => main(),
    pollingTime,
  );
}

main();
