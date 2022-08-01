-- Dropping pool views
DROP VIEW pool_day_locked;
DROP VIEW pool_hour_locked;
DROP VIEW pool_minute_locked;

-- Dropping pool locked functions
DROP FUNCTION pool_locked;
DROP FUNCTION pool_prepare_locked_data;