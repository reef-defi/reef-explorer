

-- DROP FUNCTION pool_ratio;


-- SELECT * FROM pool_candlestick('minute');

-- DROP FUNCTION qr;


-- DROP FUNCTION pool_query_ratio;
-- CREATE FUNCTION pool_query_ratio (
--   duration text
-- )
--   RETURNS TABLE (id BIGINT, timeframe timestamptz)
--   as $$
--   begin
--     return query
--     SELECT 
--       pe.id as id,
--       date_trunc(duration, pe.timestamp) as timeframe
--     FROM pool_event as pe;
--   end; $$
--   LANGUAGE plpgsql;
-- CREATE FUNCTION pool_query_ratio (
--   duration text
-- )
--   RETURNS TABLE (
--     pool_id BIGINT, 
--     timeframe timestamptz,
--     token_1_ratio decimal,
--     token_2_ratio decimal,
--     which_tolken int
--   )
--   as $$
--   begin
--     return query
--     SELECT 
--       pe.pool_id as pool_id,
--       date_trunc(duration, pe.timestamp) as timeframe,
--       (
--         CASE 
--           WHEN pe.amount_in_2 > 0
--           THEN pe.amount_1/pe.amount_in_2
--           ELSE 1
--         END
--       ) as token_1_ratio,
--       (
--         CASE
--           WHEN pe.amount_in_1 > 0
--           THEN pe.amount_2/pe.amount_in_1
--           ELSE 1
--         END
--       ) as token_2_ratio,
--       (
--         CASE
--           WHEN pe.amount_in_2 > 0
--           THEN 1
--           ELSE 2
--         END
--       ) as which_token
--     FROM pool_event as pe
--     WHERE pe.type = 'Swap'
--     ORDER BY pe.timestamp;
--   end; $$
--   LANGUAGE plpgsql;


-- SELECT * FROM pool_query_ratio('minute');

-- DROP FUNCTION pool_candlestick;
-- CREATE FUNCTION pool_candlestick (
--   duration text
-- )
--   RETURNS TABLE (
--     timeframe timestamptz,
--     pool_id BIGINT,
--     which_token int
--     -- low_ratio_token_1 decimal,
--     -- low_ratio_token_2 decimal,
--     -- high_ratio_token_1 decimal,
--     -- high_ratio_token_2 decimal,
--     -- open_ratio_token_1 decimal,
--     -- open_ratio_token_2 decimal,
--     -- close_ratio_token_1 decimal,
--     -- close_ratio_token_2 decimal
--   )
--   AS $$
--   BEGIN
--     RETURN QUERY
--     SELECT 
--       org.timeframe as timeframe,
--       org.pool_id as pool_id,
--       org.which_token as which_token
--       -- MIN(org.token_1_ratio) as low_ratio_token_1,
--       -- MAX(org.token_1_ratio) as high_ratio_token_1,
--       -- MIN(org.token_2_ratio) as low_ratio_token_2,
--       -- MAX(org.token_2_ratio) as high_ratio_token_2,
--       -- (
--       --   SELECT DISTINCT ON (sub.minutes)
--       --     sub.token_1_ratio
--       --   FROM pool_ratio_query(duration) as sub
--       --   WHERE 
--       --     org.minutes = sub.minutes AND 
--       --     MIN(org.timestamp) = sub.timestamp
--       -- ) as opened_token_1_ratio,
--       -- (
--       --   SELECT DISTINCT ON (sub.minutes)
--       --     sub.token_1_ratio
--       --   FROM pool_ratio_query(duration) as sub
--       --   WHERE 
--       --     org.minutes = sub.minutes AND 
--       --     MAX(org.timestamp) = sub.timestamp
--       -- ) as closed_token_1_ratio,
--       -- (
--       --   SELECT DISTINCT ON (sub.minutes)
--       --     sub.token_2_ratio
--       --   FROM pool_ratio_query(duration) as sub
--       --   WHERE 
--       --     org.minutes = sub.minutes AND 
--       --     MIN(org.timestamp) = sub.timestamp
--       -- ) as opened_token_2_ratio,
--       -- (
--       --   SELECT DISTINCT ON (sub.minutes)
--       --     sub.token_2_ratio
--       --   FROM pool_ratio_query(duration) as sub
--       --   WHERE 
--       --     org.minutes = sub.minutes AND 
--       --     MAX(org.timestamp) = sub.timestamp
--       -- ) as closed_token_2_ratio
--     FROM pool_ratio_query(duration) as org
--     GROUP BY org.minutes, org.pool_id, org.which_token
--     ORDER BY org.pool_id, org.minutes;
--   end; $$
--   LANGUAGE plpgsql;


-- SELECT * FROM pool_candlestick('minute');

-- SELECT 
--     org.timeframe as timeframe,
--     org.pool_id as pool_id,
--     org.which_tolken as which_token,
--     MIN(org.token_1_ratio) as low_ratio_token_1,
--     MAX(org.token_1_ratio) as high_ratio_token_1,
--     MIN(org.token_2_ratio) as low_ratio_token_2,
--     MAX(org.token_2_ratio) as high_ratio_token_2,
--     (
--       SELECT DISTINCT ON (sub.timeframe)
--         sub.token_1_ratio
--       FROM pool_ratio_query('minute') as sub
--       WHERE 
--         org.timeframe = sub.timeframe AND 
--         MIN(org.timestamp) = sub.timestamp
--     ) as opened_token_1_ratio
--     -- (
--     --   SELECT DISTINCT ON (sub.minutes)
--     --     sub.token_1_ratio
--     --   FROM pool_ratio_query('minute') as sub
--     --   WHERE 
--     --     org.minutes = sub.minutes AND 
--     --     MAX(org.timestamp) = sub.timestamp
--     -- ) as closed_token_1_ratio,
--     -- (
--     --   SELECT DISTINCT ON (sub.minutes)
--     --     sub.token_2_ratio
--     --   FROM pool_ratio_query('minute') as sub
--     --   WHERE 
--     --     org.minutes = sub.minutes AND 
--     --     MIN(org.timestamp) = sub.timestamp
--     -- ) as opened_token_2_ratio,
--     -- (
--     --   SELECT DISTINCT ON (sub.minutes)
--     --     sub.token_2_ratio
--     --   FROM pool_ratio_query('minute') as sub
--     --   WHERE 
--     --     org.minutes = sub.minutes AND 
--     --     MAX(org.timestamp) = sub.timestamp
--     -- ) as closed_token_2_ratio
--   FROM pool_query_ratio('minute') as org
--   GROUP BY org.timeframe, org.pool_id, org.which_tolken
--   ORDER BY org.pool_id, org.timeframe;


--  SELECT DISTINCT ON (timeframe)
--   *
-- FROM pool_ratio_query('minute')
      -- WHERE 
        -- org.timeframe = sub.timeframe AND 
        -- MIN(org.timestamp) = sub.timestamp

-- SELECT last_value FROM pool_event_serail_id;
-- DROP SEQUENCE pool_event_sequence;
-- CREATE SEQUENCE pool_event_sequence START 1;
-- DELETE FROM pool WHERE id > 0;
-- DELETE FROM pool_event WHERE id > 0;

-- SELECT * from pool_event_sequence;
-- SELECT currval('pool_event_sequence')
-- SELECT count(*) FROM pool_event;

-- SELECT
-- -- timestamp
--   MAX(amount_1)
--   -- MAX(amount_1)
--   -- MIN(amount_1),
--   -- MAX(amount_1)
-- -- amount_1 as token_1_buy_amount, amount_2 as token_2_buy_amount, amount_in_1 as token_1_sell, amount_in_2 as token_2_sell  
-- FROM pool_event
-- WHERE (amount_1 > 0 OR amount_2 > 0) AND type = 'Swap'
-- GROUP BY date_trunc('minute', timestamp)
-- ORDER BY timestamp;


-- SELECT * FROM pool_ratio;

-- SELECT 
--   org.minutes,
--   org.pool_id,
--   org.which_token,
--   COUNT(*) as n_swaps,
--   MAX(org.token_1_ratio) as low_ratio,
--   MIN(org.token_1_ratio) as high_ratio,
--   (
--     SELECT DISTINCT ON (sub.minutes)
--       sub.token_1_ratio
--     FROM pool_ratio as sub
--     WHERE org.minutes = sub.minutes
--   ) as opened_ratio,
--   (
--     SELECT DISTINCT ON (sub.minutes)
--       sub.token_1_ratio
--     FROM pool_ratio as sub
--     WHERE 
--       org.minutes = sub.minutes AND 
--       MAX(org.timestamp) = sub.timestamp
--   ) as closed_ratio
-- FROM pool_ratio as org
-- GROUP BY org.minutes, org.pool_id, org.which_token
-- ORDER BY org.pool_id, org.minutes, org.which_token;


-- SELECT DISTINCT ON (minutes)
--   *
-- FROM prices;

-- SELECT 
--   COUNT(*)
-- FROM prices
-- GROUP BY minutes
-- ORDER BY minutes;

  -- WHERE price > 0 AND type = 'Swap'

-- SELECT 
--   FIRST_VALUE (price)
--   OVER (
--     PARTITION BY minutes
--     ORDER BY timestamp
--   )
-- FROM pool_price;


-- SELECT 
--   -- tmp.*
--   pool_id,
--   (SELECT DISTINCT ON (minutes) price FROM )
--   -- MAX(price),
--   -- MIN(price)
--   -- COUNT(*)
--   -- FIRST_VALUE (pool_id)
--   -- OVER (
--   --   PARTITION BY minutes
--   -- ) test
-- FROM (
--   SELECT 
--     pool_id, timestamp, amount_1 as price, date_trunc('minute', timestamp) as minutes
--   FROM pool_event
--   WHERE amount_1 > 0 AND type = 'Swap'
-- ) as tmp
-- -- GROUP BY minutes
-- ORDER BY minutes;
-- GROUP BY petime
-- ORDER BY petime;


  -- SELECT distinct ON (timestamp)
  --   amount_1,
  --   timestamp,
  --   date_trunc('minute', timestamp)
  -- FROM pool_event


-- FIRST * FROM pool_event;

-- V2

-- WITH pool_ratio AS (
--   SELECT 
--     pool_id,
--     timestamp,
--     type,
--     date_trunc('minute', timestamp) as minutes,
--     (
--       CASE 
--         WHEN amount_in_2 > 0
--         THEN amount_1/amount_in_2
--         ELSE 1
--       END
--     ) as token_1_ratio,
--     (
--       CASE
--         WHEN amount_in_1 > 0
--         THEN amount_2/amount_in_1
--         ELSE 1
--       END
--     ) as token_2_ratio,
--     (
--       CASE
--         WHEN amount_in_2 > 0
--         THEN 1
--         ELSE 2
--       END
--     ) as which_token
--     FROM pool_event
--     WHERE type = 'Swap'
--     ORDER BY timestamp
-- )

-- SELECT 
--   org.minutes,
--   org.pool_id,
--   org.which_token,
--   COUNT(*) as n_swaps,
--   MIN(org.token_1_ratio) as low_ratio_token_1,
--   MAX(org.token_1_ratio) as high_ratio_token_1,
--   MIN(org.token_2_ratio) as low_ratio_token_2,
--   MAX(org.token_2_ratio) as high_ratio_token_2,
--   (
--     SELECT DISTINCT ON (sub.minutes)
--       sub.token_1_ratio
--     FROM pool_ratio as sub
--     WHERE 
--       org.minutes = sub.minutes AND 
--       MIN(org.timestamp) = sub.timestamp
--   ) as opened_token_1_ratio,
--   (
--     SELECT DISTINCT ON (sub.minutes)
--       sub.token_1_ratio
--     FROM pool_ratio as sub
--     WHERE 
--       org.minutes = sub.minutes AND 
--       MAX(org.timestamp) = sub.timestamp
--   ) as closed_token_1_ratio,
--   (
--     SELECT DISTINCT ON (sub.minutes)
--       sub.token_2_ratio
--     FROM pool_ratio as sub
--     WHERE 
--       org.minutes = sub.minutes AND 
--       MIN(org.timestamp) = sub.timestamp
--   ) as opened_token_2_ratio,
--   (
--     SELECT DISTINCT ON (sub.minutes)
--       sub.token_2_ratio
--     FROM pool_ratio as sub
--     WHERE 
--       org.minutes = sub.minutes AND 
--       MAX(org.timestamp) = sub.timestamp
--   ) as closed_token_2_ratio
-- FROM pool_ratio as org
-- GROUP BY org.minutes, org.pool_id, org.which_token
-- ORDER BY org.pool_id, org.minutes;






-- CREATE TYPE pool_ratio_type AS (pool_id int, timestamp text, type text, timeframe text, token_1_ratio decimal);

-- CREATE FUNCTIOn pool_ratio_query(text) RETURNS pool_ratio_type
--   AS $$
--     SELECT 
--       pool_id,
--       timestamp,
--       type,
--       date_trunc(CAST($1 as TEXT), timestamp) as minutes,
--       (
--         CASE 
--           WHEN amount_in_2 > 0
--           THEN amount_1/amount_in_2
--           ELSE 1
--         END
--       ) as token_1_ratio
--     FROM pool_event
--     WHERE type = 'Swap' AND amount_in_2 > 0
--     ORDER BY timestamp
--   $$
--   LANGUAGE SQL;

-- SELECT * FROM pool_ratio_query("minute")


-- CREATE FUNCTION one() RETURNS integer as $$
--   SELECT 1 AS result;
-- $$ LANGUAGE SQL;

-- SELECT one();