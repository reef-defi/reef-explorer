import axios from "axios";
import {Pool} from "pg";

export const config = {
  recaptchaSecret: process.env.RECAPTCHA_SECRET || '',
  httpPort: process.env.PORT || 8000,
  nodeWs: 'ws://substrate-node:9944',
  postgresConfig: {
    // port: 54321,
    // host: '0.0.0.0',
    user: process.env.POSTGRES_USER || 'reefexplorer',
    host: process.env.POSTGRES_HOST || 'postgres',
    database: process.env.POSTGRES_DATABASE || 'reefexplorer',
    password: process.env.POSTGRES_PASSWORD || 'reefexplorer',
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  }
}

export const query = async <Res>(statement: string, args: any[]): Promise<Res[]> => {
  const db = new Pool({...config.postgresConfig});
  await db.connect();
  const result = await db.query(statement, [...args]);
  return result.rows;
}


interface Price {
  usd: number;
  usd_24h_change: number;
}

interface PriceWrapper {
  [coin: string]: Price;
}

const REEF_DENOM = "reef-finance";
export const getReefPrice = async (): Promise<Price> => axios
  .get<PriceWrapper>(`https://api.coingecko.com/api/v3/simple/price?ids=${REEF_DENOM}&vs_currencies=usd&include_24hr_change=true`)
  .then((res) => res.data[REEF_DENOM])
  .then((res) => ({...res}))
  .catch((err) => {
    console.log(err);
    throw new Error("Can not extract reef price from coingecko...")
  });
  
  
export const authenticationToken = async (token: string): Promise<boolean> => await axios
  .get(`https://www.google.com/recaptcha/api/siteverify?secret=${config.recaptchaSecret}&response=${token}`)
  .then((res) => res.data)
  .then((res) => res.success)
  .catch((err) => {
    console.log(err);
    throw new Error("Can not extract recaptcha token...")
  });