import axios from "axios";
import { APP_CONFIGURATION } from "../utils/config";
import { queryDb } from "../utils/connector";
import { ensure } from "../utils/utils";

const REEF_DENOM = "reef-finance";

interface Price {
  usd: number;
  usd_24h_change: number;
}

interface PriceWrapper {
  [coin: string]: Price;
}

export const authenticationToken = async (token: string): Promise<boolean> => await axios
  .get(`https://www.google.com/recaptcha/api/siteverify?secret=${APP_CONFIGURATION.recaptchaSecret}&response=${token}`)
  .then((res) => res.data.success)
  .catch((err) => {
    console.log(err);
    throw new Error("Can not extract recaptcha token...")
  });

export const getReefPrice = async (): Promise<Price> => axios
  .get<PriceWrapper>(`https://api.coingecko.com/api/v3/simple/price?ids=${REEF_DENOM}&vs_currencies=usd&include_24hr_change=true`)
  .then((res) => res.data[REEF_DENOM])
  .then((res) => ({...res}))
  .catch((err) => {
    console.log(err);
    throw new Error("Can not extract reef price from coingecko...")
  });
  

interface LastBlock {
  id: number;
  timestamp: string;
}

export const getLastBlock = async (): Promise<LastBlock> => {
  const res = await queryDb<LastBlock>(`SELECT id, timestamp FROM block ORDER BY id DESC`);
  ensure(res.length > 0, 'Last block is not found');
  return {
    id: res[0].id,
    timestamp: res[0].timestamp
  };
};