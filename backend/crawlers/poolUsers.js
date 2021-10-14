// DRAFT, DONT ENABLE!!!

// @ts-check
const pino = require('pino');
const { Contract } = require('ethers');
const {
  wait,
  getClient,
  getProviderAPI,
  isNodeSynced,
  dbQuery,
} = require('../lib/utils');
const backendConfig = require('../backend.config');
const ERC20 = require('../assets/erc20Abi.json');

const ReefswapFactory = require('../assets/abi/ReefswapFactory');
const ReefswapRouter = require('../assets/abi/ReefswapRouter.js');

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
const crawlerName = 'poolUsers';

const logger = pino({
  level: backendConfig.logLevel,
});
const loggerOptions = {
  crawler: crawlerName,
};
const config = backendConfig.crawlers.find(
  ({ name }) => name === crawlerName,
);

const ensure = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
}

const combinations = (values) => {
  var comb = [];
  for (let i = 0; i < values.length; i ++) {
    for (let j = i + 1; j < values.length; j ++) {
      comb.push([values[i], values[j]]);
    }
  }
  return comb;
};

const findPoolTokenAddress = async (
  address1,
  address2,
  signer,
  factoryAddress,
) => {
  const reefswapFactory = getReefswapFactory(factoryAddress, signer);
  const address = await reefswapFactory.getPair(address1, address2);
  return address;
};

const getContract = async (address, signer) => {
  return new Contract(address, ERC20, signer);
};

const balanceOf = async (address, balanceAddress, signer) => {
  const contract = await getContract(address, signer);
  const balance = await contract.balanceOf(balanceAddress);
  return balance;
};

const getReefswapRouter = () => new Contract(network.routerAddress, ReefswapRouter, signer);

const getReefswapFactory = () => new Contract(network.factoryAddress, ReefswapFactory, signer);

const getPool = async (
  token1,
  token2,
  signer,
  factoryAddress,
) => {
  const address = await findPoolTokenAddress(
    token1.address,
    token2.address,
    signer,
    factoryAddress,
  );
  ensure(address !== EMPTY_ADDRESS, 'Pool does not exist!');
  const contract = new Contract(address, ReefswapPair, signer);

  const decimals = await contract.decimals();
  const reserves = await contract.getReserves();
  const totalSupply = await contract.totalSupply();
  const minimumLiquidity = await contract.MINIMUM_LIQUIDITY();
  const liquidity = await contract.balanceOf(await signer.getAddress());

  const address1 = await contract.token1();

  const tokenBalance1 = await balanceOf(token1.address, address, signer);
  const tokenBalance2 = await balanceOf(token2.address, address, signer);

  const [finalToken1, finalToken2] = token1.address === address1
    ? [
      { ...token1, balance: tokenBalance1 },
      { ...token2, balance: tokenBalance2 },
    ]
    : [
      { ...token2, balance: tokenBalance2 },
      { ...token1, balance: tokenBalance1 },
    ];

  const [finalReserve1, finalReserve2] = token1.address === address1
    ? [reserves[0], reserves[1]]
    : [reserves[1], reserves[0]];

  return {
    poolAddress: address,
    decimals: parseInt(decimals, 10),
    reserve1: finalReserve1.toString(),
    reserve2: finalReserve2.toString(),
    totalSupply: totalSupply.toString(),
    userPoolBalance: liquidity.toString(),
    minimumLiquidity: minimumLiquidity.toString(),
    token1: finalToken1,
    token2: finalToken2,
  };
};

const crawler = async (delayedStart) => {
  if (delayedStart) {
    logger.debug(loggerOptions, `Delaying pool crawler start for ${config.startDelay / 1000}s`);
    await wait(config.startDelay);
  }

  logger.debug(loggerOptions, 'Running pool crawler...');
  const client = await getClient(loggerOptions);
  const provider = await getProviderAPI(loggerOptions);

  let synced = await isNodeSynced(provider.api, loggerOptions);
  while (!synced) {
    // eslint-disable-next-line no-await-in-loop
    await wait(10000);
    // eslint-disable-next-line no-await-in-loop
    synced = await isNodeSynced(provider.api, loggerOptions);
  }

  const startTime = new Date().getTime();

  // Get tokens
  const tokensQuery = 'SELECT contract_id FROM contract WHERE token_validated IS TRUE;';
  const tokens = await dbQuery(client, tokensQuery, loggerOptions);

  const tokenPairs = combinations(tokens.rows);

  // eslint-disable-next-line no-restricted-syntax
  for (const tokenPair of tokenPairs) {
    logger.info(loggerOptions, `Processing token ${token.token_name} (${token.contract_id})`);
    await updateTokenHolders(client, provider, token.contract_id, erc20Abi, accounts, blockHeight, timestamp, loggerOptions);
  }

  logger.debug(loggerOptions, 'Disconnecting from API');
  await provider.api.disconnect().catch((error) => logger.error(loggerOptions, `API disconnect error: ${JSON.stringify(error)}`));

  logger.debug(loggerOptions, 'Disconnecting from DB');
  await client.end().catch((error) => logger.error(loggerOptions, `DB disconnect error: ${JSON.stringify(error)}`));

  const endTime = new Date().getTime();
  logger.info(loggerOptions, `Processed ${tokenPairs.length} token pairs in ${((endTime - startTime) / 1000).toFixed(0)}s`);

  logger.info(loggerOptions, `Next execution in ${(config.pollingTime / 60000).toFixed(0)}m...`);
  setTimeout(
    () => crawler(false),
    config.pollingTime,
  );
};

crawler(true).catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(-1);
});
