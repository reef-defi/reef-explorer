import { Response } from 'express';
import { AppRequest, ContractData, QueryVerifiedPoolsWithUserLPReq } from '../utils/types';
import { query } from '../utils/connector';
import { validateData, verifiedPoolsWithUserLPValidator } from './validators';

const DEFAULT_VERIFIED_POOLS_WITH_USER_LP_QUERY = `
SELECT 
	p.address, 
	p.token_1, 
	p.token_2, 
	dv.day_volume_1,
	dv.day_volume_2,
	dl.prev_day_volume_1, 
	dl.prev_day_volume_2, 
	ulp.user_locked_amount_1,
	ulp.user_locked_amount_2,
	pr.reserved_1,
	pr.reserved_2,
	v1.contract_data as contract_data_1, 
	v2.contract_data as contract_data_2
FROM verified_pool as p
LEFT JOIN (
	SELECT 
		pv.pool_id, 
		SUM(pv.amount_1) as day_volume_1, 
		SUM(pv.amount_2) as day_volume_2
	FROM pool_hour_volume as pv
	WHERE pv.timeframe > NOW() - INTERVAL '1 DAY'
	GROUP BY pv.pool_id
) as dv ON p.id = dv.pool_id
LEFT JOIN (
	SELECT 
		pi.pool_id, 
		SUM(pi.amount_1) as prev_day_volume_1, 
		SUM(pi.amount_2) as prev_day_volume_2
	FROM pool_hour_volume as pi
	WHERE 
		pi.timeframe < NOW() - INTERVAL '1 DAY' AND 
		pi.timeframe > NOW() - INTERVAL '2 DAY'
	GROUP BY pi.pool_id
) as dl ON p.id = dl.pool_id
{USER_JOIN} JOIN (
	SELECT 
		pe.pool_id, 
		SUM(pe.amount_1) as user_locked_amount_1, 
		SUM(pe.amount_2) as user_locked_amount_2
	FROM pool_event as pe
	JOIN evm_event as ee ON pe.evm_event_id = ee.id
	JOIN event as e ON ee.event_id = e.id
	JOIN extrinsic as ex ON e.extrinsic_id = ex.id
	WHERE 
		signer ILIKE $1 AND 
		(pe.type = 'Mint' OR pe.type = 'Burn')
	GROUP BY pe.pool_id
) as ulp ON ulp.pool_id = p.id
LEFT JOIN (
	SELECT DISTINCT ON (pool_id)
		pool_id,
		reserved_1,
		reserved_2
	FROM pool_event
	WHERE type = 'Sync'
	ORDER BY pool_id asc, timestamp desc
) as pr ON pr.pool_id = p.id
JOIN verified_contract as v1 ON v1.address = p.token_1
JOIN verified_contract as v2 ON v2.address = p.token_2
{SEARCH}
LIMIT $2
OFFSET $3
`;

const ADDITIONAL_SEARCH = `WHERE (
  p.address ILIKE $4 OR 
  p.token_1 ILIKE $4 OR 
  p.token_2 ILIKE $4 OR 
  v1.contract_data->>'name' ILIKE $4 OR
  v2.contract_data->>'name' ILIKE $4 OR
  v1.contract_data->>'symbol' ILIKE $4 OR
  v2.contract_data->>'symbol' ILIKE $4
)
`;

const VERIFIED_POOLS_WITH_USER_LP_QUERY = DEFAULT_VERIFIED_POOLS_WITH_USER_LP_QUERY
  .replace('{USER_JOIN}', 'LEFT')
  .replace('{SEARCH}', '');
const VERIFIED_POOLS_WITH_USER_LP_WITH_SEARCH_QUERY = DEFAULT_VERIFIED_POOLS_WITH_USER_LP_QUERY
  .replace('{USER_JOIN}', 'LEFT')
  .replace('{SEARCH}', ADDITIONAL_SEARCH);
const USER_POOLS_ONLY_QUERY = DEFAULT_VERIFIED_POOLS_WITH_USER_LP_QUERY
  .replace('{USER_JOIN}', 'INNER')
  .replace('{SEARCH}', '');
const USER_POOLS_ONLY_WITH_SEARCH_QUERY = DEFAULT_VERIFIED_POOLS_WITH_USER_LP_QUERY
  .replace('{USER_JOIN}', 'INNER')
  .replace('{SEARCH}', ADDITIONAL_SEARCH);

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
  const args = [
    req.body.signer,
    req.body.limit,
    req.body.offset,
  ];
  const result = req.body.search
    ? await query<VerifiedPoolsWithUserLPResult>(
      VERIFIED_POOLS_WITH_USER_LP_WITH_SEARCH_QUERY,
      [...args, req.body.search],
    )
    : await query<VerifiedPoolsWithUserLPResult>(
      VERIFIED_POOLS_WITH_USER_LP_QUERY,
      args,
    );
  res.send(result);
};

export const queryVerifiedUserPools = async (req: AppRequest<QueryVerifiedPoolsWithUserLPReq>, res: Response) => {
  validateData(req.body, verifiedPoolsWithUserLPValidator);
  const args = [
    req.body.signer,
    req.body.limit,
    req.body.offset,
  ];
  const result = req.body.search
    ? await query<VerifiedPoolsWithUserLPResult>(USER_POOLS_ONLY_WITH_SEARCH_QUERY, [...args, req.body.search])
    : await query<VerifiedPoolsWithUserLPResult>(USER_POOLS_ONLY_QUERY, args);
  res.send(result);
};
