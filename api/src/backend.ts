// @ts-check
import express = require('express');
import { Pool } from 'pg';
import config = require('../api.config');

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

// Renamed from Pool to ReefPool to avoid collision with pg Pool
interface ReefPool extends BasicPool {
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

const getPool = async (): Promise<Pool> => {
  const pool = new Pool(config.postgresConnParams);
  await pool.connect();
  return pool;
}

const app = express();

// Get User Reef Balance
const TOKEN_QUERY = `SELECT balance FROM token_holder WHERE holder_evm_address OR holder_account_id = $1`;
app.post('/api/user-balance', async (req: any, res) => {
  try {
    const userAddress = req.body.userAddress;
    const pool = await getPool();
    const dbres = await pool.query(TOKEN_QUERY, [userAddress]);
    res.send(dbres.rows[0].balance || 0);
    await pool.end();
  } catch (e) {
    res.send(0)
  }
});

app.listen(config.httpPort, () => 
  console.log(`Reef explorer API is listening on port ${config.httpPort}.`)
);
