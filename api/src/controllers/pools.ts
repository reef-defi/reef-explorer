import { Response } from "express";
import { AppRequest, ContractData, QueryVerifiedPoolsWithUserLPReq } from '../utils/types';
import {validateData, verifiedPoolsWithUserLPValidator} from "./validators";
import {query} from "./../utils/connector"

const VERIFIED_POOLS_WITH_USER_LP_QUERY = `
SELECT p.address, p.token_1, p.token_2, pe.reserved_1, pe.reserved_2, ulp.user_locked_amount_1, ulp.user_locked_amount_2, v1.contract_data as contract_data_1, v2.contract_data as contract_data_2
FROM pool_event as pe,
(
	SELECT pr.pool_id, MAX(pr.timestamp) as max_timestamp
	FROM pool_event as pr 
	WHERE pr.type = 'Sync'
	GROUP BY pr.pool_id
) lt
JOIN verified_pool as p ON (p.id = pool_id)
LEFT JOIN (
	SELECT pe.pool_id, SUM(pe.amount_1) as user_locked_amount_1, SUM(pe.amount_2) as user_locked_amount_2
	FROM pool_event as pe
	JOIN evm_event as ee ON pe.evm_event_id = ee.id
	JOIN event as e ON ee.event_id = e.id
	JOIN extrinsic as ex ON e.extrinsic_id = ex.id
	WHERE signer ILIKE $1 AND (pe.type = 'Mint' OR pe.type = 'Burn')
	GROUP BY pe.pool_id
) as ulp ON ulp.pool_id = p.id
LEFT JOIN verified_contract as v1 ON v1.address = p.token_1
LEFT JOIN verified_contract as v2 ON v2.address = p.token_2
WHERE pe.pool_id = lt.pool_id AND pe.timestamp = lt.max_timestamp AND pe.type = 'Sync'
LIMIT $2
OFFSET $3
`

interface VerifiedPoolsWithUserLPResult {
  address: string;
  token_1: string;
  token_2: string;
  reserved_1: string;
  reserved_2: string;
  user_locked_amount_1: string;
  user_locked_amount_2: string;
  contract_data_1: ContractData;
  contract_data_2: ContractData;
}

export const queryVerifiedPoolsWithUserLP = async (req: AppRequest<QueryVerifiedPoolsWithUserLPReq>, res: Response) => {
  validateData(req.body, verifiedPoolsWithUserLPValidator);
  const result = await query<VerifiedPoolsWithUserLPResult>(
    VERIFIED_POOLS_WITH_USER_LP_QUERY, 
    [req.body.signer, req.body.limit, req.body.offset]
  );
  res.send(result)
}