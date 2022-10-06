DROP VIEW IF EXISTS volume_raw_min;
DROP VIEW IF EXISTS volume_raw_hour;
DROP VIEW IF EXISTS volume_raw_day;
DROP VIEW IF EXISTS volume_raw_week;
DROP FUNCTION IF EXISTS volume_window_raw;
DROP FUNCTION IF EXISTS volume_prepare_raw;

DROP VIEW IF EXISTS reserved_raw_min;
DROP VIEW IF EXISTS reserved_raw_hour;
DROP VIEW IF EXISTS reserved_raw_day;
DROP VIEW IF EXISTS reserved_raw_week;
DROP FUNCTION IF EXISTS reserved_window_raw;
DROP FUNCTION IF EXISTS reserved_prepare_raw;

DROP VIEW IF EXISTS token_price_min;
DROP VIEW IF EXISTS token_price_hour;
DROP VIEW IF EXISTS token_price_day;
DROP VIEW IF EXISTS token_price_week;
DROP FUNCTION IF EXISTS token_price_window;
DROP FUNCTION IF EXISTS token_price_prepare;

DROP VIEW IF EXISTS fee_min;
DROP VIEW IF EXISTS fee_hour;
DROP VIEW IF EXISTS fee_day;
DROP VIEW IF EXISTS fee_week;
DROP FUNCTION IF EXISTS fee_window;
DROP FUNCTION IF EXISTS fee_prepare;
DROP VIEW IF EXISTS fee;

DROP VIEW IF EXISTS fee_raw_min;
DROP VIEW IF EXISTS fee_raw_hour;
DROP VIEW IF EXISTS fee_raw_day;
DROP VIEW IF EXISTS fee_raw_week;
DROP FUNCTION IF EXISTS fee_window_raw;
DROP FUNCTION IF EXISTS fee_prepare_raw;
DROP VIEW IF EXISTS fee_raw;

DROP VIEW IF EXISTS candlestick_min;
DROP VIEW IF EXISTS candlestick_hour;
DROP VIEW IF EXISTS candlestick_day;
DROP VIEW IF EXISTS candlestick_week;
DROP FUNCTION IF EXISTS candlestick_window;
DROP FUNCTION IF EXISTS candlestick_prepare;

DROP VIEW IF EXISTS volume_change_min;
DROP VIEW IF EXISTS volume_change_hour;
DROP VIEW IF EXISTS volume_change_day;
DROP VIEW IF EXISTS volume_change_week;
DROP VIEW IF EXISTS volume_change;
DROP FUNCTION IF EXISTS change;

DROP VIEW IF EXISTS volume_min;
DROP VIEW IF EXISTS volume_hour;
DROP VIEW IF EXISTS volume_day;
DROP VIEW IF EXISTS volume_week;
DROP FUNCTION IF EXISTS volume_window;
DROP FUNCTION IF EXISTS volume_prepare;
DROP VIEW IF EXISTS volume;

DROP VIEW IF EXISTS reserved_min;
DROP VIEW IF EXISTS reserved_hour;
DROP VIEW IF EXISTS reserved_day;
DROP VIEW IF EXISTS reserved_week;
DROP FUNCTION IF EXISTS reserved_window;
DROP FUNCTION IF EXISTS reserved_prepare;
DROP VIEW IF EXISTS reserved;

-- Token price table and indexes
DROP INDEX IF EXISTS token_price_block_id_idx;
DROP INDEX IF EXISTS token_price_token_address_idx;
DROP INDEX IF EXISTS token_price_timestamp_idx;
DROP TABLE IF EXISTS token_price;

-- Candlestick table and indexes
DROP INDEX IF EXISTS candlestick_block_id_idx;
DROP INDEX IF EXISTS candlestick_pool_id_idx;
DROP INDEX IF EXISTS candlestick_token_address_idx;
DROP INDEX IF EXISTS candlestick_timestamp_idx;
DROP TABLE IF EXISTS candlestick;

-- Reserved raw table and indexes
DROP INDEX IF EXISTS reserved_block_id_idx;
DROP INDEX IF EXISTS reserved_pool_id_idx;
DROP INDEX IF EXISTS reserved_evm_event_id_idx;
DROP INDEX IF EXISTS reserved_timestamp_idx;
DROP TABLE IF EXISTS reserved_raw;

-- Volume table and indexes
DROP INDEX IF EXISTS volume_raw_block_id_idx;
DROP INDEX IF EXISTS volume_raw_pool_id_idx;
DROP INDEX IF EXISTS volume_raw_timestamp_idx;
DROP TABLE IF EXISTS volume_raw;

DROP VIEW IF EXISTS pool_info;

CREATE OR REPLACE VIEW verified_pool AS
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

CREATE OR REPLACE VIEW verified_pool_event AS
	SELECT 
		pe.*
	FROM pool_event AS pe
  JOIN pool AS p ON p.id = pe.pool_id
	RIGHT JOIN verified_contract AS v1 ON p.token_1 = v1.address
	RIGHT JOIN verified_contract AS v2 ON p.token_2 = v2.address
	WHERE p IS NOT NULL;
