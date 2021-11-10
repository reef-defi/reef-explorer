import axios from "axios";
import {Pool} from "pg";
import { APP_CONFIGURATION } from "./config";


export const query = async <Res>(statement: string, args: any[]): Promise<Res[]> => {
  const db = new Pool({...APP_CONFIGURATION.postgresConfig});
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
  .get(`https://www.google.com/recaptcha/api/siteverify?secret=${APP_CONFIGURATION.recaptchaSecret}&response=${token}`)
  .then((res) => res.data.success)
  .catch((err) => {
    console.log(err);
    throw new Error("Can not extract recaptcha token...")
  });