

-- Restart pool data
-- DELETE FROM pool_event WHERE id > 0;
-- DELETE FROM pool WHERE id > 0;
-- DROP SEQUENCE pool_event_sequence;
-- CREATE SEQUENCE pool_event_sequence START 1;


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

