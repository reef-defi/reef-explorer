-- Dropping pool views
DROP VIEW pool_day_fee;
DROP VIEW pool_hour_fee;
DROP VIEW pool_minute_fee;

DROP VIEW pool_day_supply;
DROP VIEW pool_hour_supply;
DROP VIEW pool_minute_supply;

DROP VIEW pool_day_volume;
DROP VIEW pool_hour_volume;
DROP VIEW pool_minute_volume;

DROP VIEW pool_day_candlestick;
DROP VIEW pool_hour_candlestick;
DROP VIEW pool_minute_candlestick;

-- Dropping pool functions
DROP FUNCTION pool_fee;
DROP FUNCTION pool_supply;
DROP FUNCTION pool_volume;
DROP FUNCTION pool_candlestick;

DROP FUNCTION pool_ratio;
DROP FUNCTION pool_prepare_fee_data;
DROP FUNCTION pool_prepare_volume_data;
DROP FUNCTION pool_prepare_supply_data;

-- Dropping pool tables
DROP TABLE pool_event;
DROP TABLE pool;

-- Dropping processed event indication
DROP SEQUENCE pool_event_sequence;

-- Dropping pool type
DROP TYPE PoolType;