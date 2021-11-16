import {Pool} from "pg";
import { APP_CONFIGURATION } from "./config";

export const query = async <Res>(statement: string, args: any[]): Promise<Res[]> => {
  const db = new Pool({...APP_CONFIGURATION.postgresConfig});
  await db.connect();
  const result = await db.query(statement, [...args]);
  return result.rows;
}
