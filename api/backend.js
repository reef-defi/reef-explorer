
// TODO change loading list for mainnet/testnet!!!
const validatedTokens = require('validated-reef-tokens.json');

interface Token {
  name: string;
  address: string;
  iconUrl: string;
  userBalance: string;
  decimals: number;
}

interface BasicPool {
  decimals: number
  reserve1: string;
  reserve2: string;
  totalSupply: string;
  poolAddress: string;
  minimumLiquidity: string;
  userPoolBalance: string;
}

interface Pool extends BasicPool {
  token1: Token;
  token2: Token;
}

// User address can be empty! 
// When it is return default values with user info set to 0 (userBalance, userPoolBalance, ...)
interface BasicReq {
  userAddress?: string;
}

interface TokenReq extends BasicReq {
  tokenAddress: string;
}

interface PoolReq extends BasicReq {
  tokenAddress1: string;
  tokenAddress2: string;
}

const ensure = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
}

// Get User Reef Balance
// TODO repare query
const USER_BALANCE_QUERY = `SELECT <Balance-field> FROM <Table> WHERE <Address-field> = $1`;
app.post('/api/user-balance', async (req: BasicReq, res: Promise<number>) => {
  try {
    const query = USER_BALANCE_QUERY
      .replace("$1", req.userAddress);
    const res = await token.query(query); // TODO replace token with you table
    res.send(res) // TODO repare response to return number!
  } catch (e) {
    res.send(0)
  }
});

// Get User Token
// TODO repare query
const TOKEN_QUERY = 'SELECT <Name> <IconUrl> <Decimals> <User-Balance> FROM <Table> WHERE <Address> = $1';
const getToken = async (tokenAddress: string): Promise<Token> => {
  const query = TOKEN_QUERY
    .replace('$1', tokenAddress);

  const res = await token.query(query); // TODO replace token with your table
  ensure(res.rows > 0, "Not found"); // TODO ensure that result exist
  
  return {
    name: res.rows[0].name,
    iconUrl: res.rows[0].iconUrl,
    decimals: res.rows[0].decimals,
    userBalance: 0,
    address: tokenAddress,
  }
};

// TODO repare query
const USER_TOKEN_QUERY = `${TOKEN_QUERY} AND <User-Address> = $2`;
const getUserToken = async (tokenAddress: string, userAddress): Promise<Token> => {
  const query = USER_TOKEN_QUERY
    .replace('$1', tokenAddress)
    .replace('$2', userAddress);
  
  const res = await token.query(query); // TODO replace token with your table
  ensure(res.rows > 0, "Not found"); // TODO ensure that result exist

  return {
    name: res.rows[0].name,
    iconUrl: res.rows[0].iconUrl,
    decimals: res.rows[0].decimals,
    userBalance: res.rows[0].userBalance,
    address: tokenAddress,
  }
}

const resolveTokenQuery = async (tokenAddress: string, userAddress?: string): Promise<Token> => userAddress
  ? getUserToken(tokenAddress, userAddress)
  : getToken(tokenAddress);

app.post('/api/get-user-token', async (req: TokenReq, res: Promise<Token>) => {
  try {
    ensure(req.tokenAddress, "tokenAddress does not exist!");
    const token = resolveTokenQuery(req.tokenAddress, req.userAddress);
    res.send(token)
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get User Pool
const POOL_QUERY = 'SELECT <Address> <Decimals> <Reserve1> <Reserve2> <User-Balance> <Total-Supply> <MinimumLiquidity> WHERE <TokenAddress1> = $1 AND <TokenAddress2> = $2';
const getPool = async (tokenAddress1: string, tokenAddress2: string): Promise<BasicPool> => {
  const query = POOL_QUERY
    .replace("$1", tokenAddress1)
    .replace("$2", tokenAddress2);
  
  const res = await pool.query(query) // TODO replace pool with appropriate table
  ensure(res.rows > 0, "Pool does not exist"); // TODO ensure pool exist

  return {
    userPoolBalance: 0,
    decimals: res.rows[0].decimals,
    reserve1: res.rows[0].reserve1,
    reserve2: res.rows[0].reserve2,
    poolAddress: res.rows[0].address,
    totalSupply: res.rows[0].totalSupply,
    minimumLiquidity: res.rows[0].minimumLiquidity,
  }
}

const USER_POOL_QUERY = `${POOL_QUERY} AND <User-Address> = $3`;
const getUserPool = async (tokenAddress1: string, tokenAddress2: string, userAddress: string): Promise<BasicPool> => {
  const query = USER_POOL_QUERY
    .replace("$1", tokenAddress1)
    .replace("$2", tokenAddress2)
    .replace("$3", userAddress);

  const res = await pool.query(query) // TODO replace pool with appropriate table
  ensure(res.rows > 0, "Pool does not exist"); // TODO ensure pool exist
  
  return {
    decimals: res.rows[0].decimals,
    reserve1: res.rows[0].reserve1,
    reserve2: res.rows[0].reserve2,
    poolAddress: res.rows[0].address,
    totalSupply: res.rows[0].totalSupply,
    userPoolBalance: res.rows[0].userPoolBalance,
    minimumLiquidity: res.rows[0].minimumLiquidity,
  }
}

const resolvePoolQuery = async (tokenAddress1: string, tokenAddress2: string, userAddress?: string) => userAddress
  ? getUserPool(tokenAddress1, tokenAddress2, userAddress)
  : getPool(tokenAddress1, tokenAddress2);

app.post('/api/get-user-pool', async (req: PoolReq, res: Promise<Pool>) => {
  try {
    ensure(req.tokenAddress1, 'tokenAddress1 does not exist');
    ensure(req.tokenAddress2, 'tokenAddress2 does not exist');

    const token1 = await resolveTokenQuery(req.tokenAddress1, req.userAddress);
    const token2 = await resolveTokenQuery(req.tokenAddress2, req.userAddress);

    const pool = await resolvePoolQuery(
      req.tokenAddress1,
      req.tokenAddress2,
      req.userAddress
    );

    res.send({...pool, token1, token2});
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get Reef Tokens List
app.post('/api/get-reef-token-list', async (req: BasicReq, res: Promise<Token[]>) => {
  try {
    const res = await Promise.all(
      validatedTokens
        .map(({address}) => await resolveTokenQuery(address, req.userAddress))
    );
    res.send(res);
  } catch (e) {
    res.status(400).send(e);
  }
});

const combinations = <T,> (values: T[]): [T, T][] => {
  var comb: [T, T][] = [];
  for (let i = 0; i < values.length; i ++) {
    for (let j = i + 1; j < values.length; j ++) {
      comb.push([values[i], values[j]]);
    }
  }
  return comb;
}

// Get Reef Pool List - Return all existing pools from Reef token list
app.post('/api/get-reef-pool-list', async (req: BasicReq, res: Promise<Pool[]>) => {
  const addresses = validatedTokens.map(({address}) => address);
  const resolvedPools = await Promise.all(
    combinations(addresses)
    .map(async ([address1, address2]) => {
      // Its a bit hacky to isolate non existing pools
      try {
        return await resolvePoolQuery(address1, address2, req.userAddress);
      } catch (e) {
        return undefined;
      }
    })
  );
  // Removing undefined pools
  const pools = resolvedPools
    .filter((pool) => !!pool);
  
  res.send(pools);
});
