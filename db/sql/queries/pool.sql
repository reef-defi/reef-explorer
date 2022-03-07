

-- Restart pool data
-- DELETE FROM pool_event WHERE id > 0;
-- DELETE FROM pool WHERE id > 0;
-- DROP SEQUENCE pool_event_sequence;
-- CREATE SEQUENCE pool_event_sequence START 1;


-- Drop pool functionality
-- DROP VIEW pool_day_volume;
-- DROP VIEW pool_hour_volume;
-- DROP VIEW pool_minute_volume;

-- DROP FUNCTION pool_volume;
-- DROP FUNCTION pool_prepare_volume_data;

-- DROP VIEW pool_day_supply;
-- DROP VIEW pool_hour_supply;
-- DROP VIEW pool_minute_supply;

-- DROP FUNCTION pool_supply;
-- DROP FUNCTION pool_prepare_supply_data;

-- DROP VIEW pool_minute_candlestick;
-- DROP VIEW pool_hour_candlestick;
-- DROP VIEW pool_day_candlestick;

-- DROP FUNCTION pool_candlestick;
-- DROP FUNCTION pool_ratio;

-- DROP TABLE pool_event;
-- DROP TABLE pool;

-- DROP SEQUENCE pool_event_sequence;
-- DROP TYPE PoolType;


-- Examples
-- Pool ration
-- SELECT * 
-- FROM pool_ratio('minute')
-- WHERE which_token = 2;

-- minute candlesticks for token 1
-- SELECT * 
-- FROM pool_minute_candlestick
-- WHERE which_token = 1;

-- day candlescticks for both tokens
-- SELECT * FROM pool_day_candlestick;

-- hour candlescticks for both tokens
-- SELECT * FROM pool_hour_candlestick;

-- Complete volume for all pools
-- SELECT * FROM pool_volume;

-- Select day candlesticks for token 1 from pool with id 1
-- SELECT * 
-- FROM pool_day_candlestick 
-- WHERE which_token = 1 AND pool_id = 1;

