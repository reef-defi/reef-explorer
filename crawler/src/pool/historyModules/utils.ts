import { queryv2 } from "../../utils/connector";

interface Reserve {
  id: number;
  evm_event_id: number;
  address: string;
  token_1: string;
  token_2: string;
  decimal_1: number;
  decimal_2: number;
  reserved_1: string;
  reserved_2: string;
}

export const queryReservedData = async (blockId: string): Promise<Reserve[]> =>
  queryv2<Reserve>(`
    SELECT p.id, p.address, r.evm_event_id, p.token_1, p.token_2, p.decimal_1, p.decimal_2, r.reserved_1, r.reserved_2 
    FROM reserved_raw as r
    JOIN pool as p ON r.pool_id = p.id
    WHERE r.block_id = $1`,
    [blockId]
  );
