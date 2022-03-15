DROP VIEW pool_minute_fee;
DROP VIEW pool_minute_supply;
DROP VIEW pool_minute_volume;
DROP VIEW pool_minute_candlestick;

DROP VIEW pool_hour_fee;
DROP VIEW pool_hour_supply;
DROP VIEW pool_hour_volume;
DROP VIEW pool_hour_candlestick;

DROP VIEW pool_day_fee;
DROP VIEW pool_day_supply;
DROP VIEW pool_day_volume;
DROP VIEW pool_day_candlestick;

DROP FUNCTION pool_fee;
DROP FUNCTION pool_supply;
DROP FUNCTION pool_volume;
DROP FUNCTION pool_candlestick;

-- fee data removed which_token field
DROP FUNCTION pool_prepare_fee_data;

-- Candlesticks
CREATE FUNCTION pool_candlestick (
  duration text
)
  RETURNS TABLE (
    timeframe timestamptz,
    pool_id BIGINT,
    low_1 decimal,
    high_1 decimal,
    low_2 decimal,
    high_2 decimal,
    open_1 decimal,
    close_1 decimal,
    open_2 decimal,
    close_2 decimal,
    which_token int
  )
  AS $$
  BEGIN
    RETURN QUERY  
    SELECT 
      org.timeframe,
      org.pool_id,
      MIN(org.ratio_1),
      MAX(org.ratio_1),
      MIN(org.ratio_2),
      MAX(org.ratio_2),
      (
        SELECT DISTINCT ON (sub.timeframe)
          sub.ratio_1
        FROM pool_ratio(duration) as sub
        WHERE 
          org.timeframe = sub.timeframe AND 
          MIN(org.exact_time) = sub.exact_time AND
          sub.which_token = 1
      ),
      (
        SELECT DISTINCT ON (sub.timeframe)
          sub.ratio_1
        FROM pool_ratio(duration) as sub
        WHERE 
          org.timeframe = sub.timeframe AND 
          MAX(org.exact_time) = sub.exact_time AND
          sub.which_token = 1
      ),
      (
        SELECT DISTINCT ON (sub.timeframe)
          sub.ratio_2
        FROM pool_ratio(duration) as sub
        WHERE 
          org.timeframe = sub.timeframe AND 
          MIN(org.exact_time) = sub.exact_time AND
          sub.which_token = 2
      ),
      (
        SELECT DISTINCT ON (sub.timeframe)
          sub.ratio_2
        FROM pool_ratio(duration) as sub
        WHERE 
          org.timeframe = sub.timeframe AND 
          MAX(org.exact_time) = sub.exact_time AND
          sub.which_token = 2
      ),
      org.which_token
    FROM pool_ratio(duration) as org
    GROUP BY org.timeframe, org.pool_id, org.which_token
    ORDER BY org.pool_id, org.timeframe;
  end; $$
  LANGUAGE plpgsql;


-- Additional pools for minute, hour and day candlestick data
CREATE VIEW pool_minute_candlestick AS
  SELECT * FROM pool_candlestick('minute');

CREATE VIEW pool_hour_candlestick AS
  SELECT * FROM pool_candlestick('hour');

CREATE VIEW pool_day_candlestick AS
  SELECT * FROM pool_candlestick('day');

-- Supply
CREATE FUNCTION pool_supply (
  duration text
) RETURNS TABLE (
  pool_id bigint,
  timeframe timestamptz,
  total_supply numeric,
  supply numeric
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.pool_id,
    p.timeframe,
    (
      SELECT DISTINCT ON (sub.timeframe)
        sub.total_supply
      FROM pool_prepare_supply_data(duration) as sub
      WHERE MAX(p.exact_time) = sub.exact_time
    ),
    (
      SELECT DISTINCT ON (sub.timeframe)
        sub.supply
      FROM pool_prepare_supply_data(duration) as sub
      WHERE MAX(p.exact_time) = sub.exact_time
    )
  FROM pool_prepare_supply_data(duration) as p
  GROUP BY p.timeframe, p.pool_id
  ORDER BY p.timeframe;
end; $$
LANGUAGE plpgsql;

-- Pool supply views
CREATE VIEW pool_day_supply AS
  SELECT * FROM pool_supply('day');

CREATE VIEW pool_hour_supply AS
  SELECT * FROM pool_supply('hour');

CREATE VIEW pool_minute_supply AS
  SELECT * FROM pool_supply('minute');

-- Volume

CREATE FUNCTION pool_volume (
  duration text
)
  RETURNS TABLE (
  	pool_id bigint,
    timeframe timestamptz,
    amount_1 numeric,
    amount_2 numeric
  )
  AS $$
  BEGIN
    RETURN QUERY
    SELECT
      p.pool_id,
      p.timeframe,
      SUM(p.amount_1),
      SUM(p.amount_2)
    FROM pool_prepare_volume_data(duration) as p
    GROUP BY p.pool_id, p.timeframe
    ORDER BY p.timeframe;
  end; $$
  LANGUAGE plpgsql;

-- Pool volume views
CREATE VIEW pool_day_volume AS
  SELECT * FROM pool_volume('day');

CREATE VIEW pool_hour_volume AS
  SELECT * FROM pool_volume('hour');

CREATE VIEW pool_minute_volume AS
  SELECT * FROM pool_volume('minute');

-- Pool fees
CREATE FUNCTION pool_prepare_fee_data (
  duration text
)
  RETURNS TABLE (
  	pool_id bigint,
    timeframe timestamptz,
    fee_1 numeric,
    fee_2 numeric,
    which_token int
  )
  AS $$
  BEGIN
    RETURN QUERY
    SELECT
      pe.pool_id,
      date_trunc(duration, pe.timestamp),
      (
        CASE
          WHEN pe.amount_in_1 > 0
          THEN pe.amount_in_1 * 0.003
          ELSE 0
        END
      ),
      (
        CASE
          WHEN pe.amount_in_2 > 0
          THEN pe.amount_in_2 * 0.003
          ELSE 0
     	END
      ),
      (
        CASE
          WHEN pe.amount_in_1 > 0
          THEN 1 -- Token 2 was bought 
          ELSE 2 -- Token 1 was bought 
     	END
      )
    FROM pool_event as pe
    WHERE pe.type = 'Swap';
  end; $$
  LANGUAGE plpgsql;

CREATE FUNCTION pool_fee (
  duration text
)
  RETURNS TABLE (
  	pool_id bigint,
    which_token int,
    timeframe timestamptz,
    fee_1 numeric,
    fee_2 numeric
  )
  AS $$
  BEGIN
    RETURN QUERY
    SELECT
      org.pool_id,
      org.which_token,
      org.timeframe,
      SUM(org.fee_1),
      SUM(org.fee_2)
    FROM pool_prepare_fee_data(duration) as org
    GROUP BY org.pool_id, org.which_token, org.timeframe
    ORDER BY org.timeframe;
  end; $$
  LANGUAGE plpgsql;

CREATE VIEW pool_day_fee AS
  SELECT * FROM pool_fee('day');

CREATE VIEW pool_hour_fee AS
  SELECT * FROM pool_fee('hour');
  
CREATE VIEW pool_minute_fee AS
  SELECT * FROM pool_fee('minute');

