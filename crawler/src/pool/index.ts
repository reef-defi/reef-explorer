import { insertV2, queryv2 } from "../utils/connector"
import config from "./../config"

export default async (event: any) => {
  // TODO repare 
  // Check if event is Reefswap factory create pool event. If so add new pool in DB
  if (event.address === config.reefswapFactoryAddress && event.method === "Create") {
    // TODO extract pool info and save it
    await insertV2('INSERT INTO pool (...)', []);
    return;
  }

  // Check if current event address is in pools table 
  // If so process pool event accordingly 
  const res = await queryv2('SELECT id FROM pool WHERE address = $1', [event.address]);
  if (res.length > 0) {
    switch (event.method) {
      case 'Swap': break;
      case 'Burn': break;
      case 'Mint': break;
      case 'Sync': break;
    }
  }

}