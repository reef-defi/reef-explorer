CREATE VIEW verified_pool AS
	SELECT 
		p.*, 
		v1.contract_data->>'name' as name_1, 
    v1.contract_data->>'symbol' as symbol_1,
		v2.contract_data->>'name' as name_2,
    v2.contract_data->>'symbol' as symbol_2
	FROM pool AS p
	RIGHT JOIN verified_contract AS v1 ON p.token_1 = v1.address
	RIGHT JOIN verified_contract AS v2 ON p.token_2 = v2.address
	WHERE p IS NOT NULL;

CREATE VIEW verified_pool_event AS
	SELECT 
		pe.*
	FROM pool_event AS pe
  JOIN pool AS p ON p.id = pe.pool_id
	RIGHT JOIN verified_contract AS v1 ON p.token_1 = v1.address
	RIGHT JOIN verified_contract AS v2 ON p.token_2 = v2.address
	WHERE p IS NOT NULL;
