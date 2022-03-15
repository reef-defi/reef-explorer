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

-- Pool candlestick using window 
CREATE FUNCTION pool_candlestick (
  duration text
)
  RETURNS TABLE (
    timeframe timestamptz,
    pool_id BIGINT,
    which_token int,
    low_1 decimal,
    high_1 decimal,
    open_1 decimal,
    close_1 decimal,
    low_2 decimal,
    high_2 decimal,
    open_2 decimal,
    close_2 decimal
  )
  AS $$
  BEGIN
    RETURN QUERY  
    SELECT
    	p.timeframe,
    	p.pool_id,
    	p.which_token,
    	MIN(p.ratio_1) OVER w,
    	MAX(p.ratio_1) OVER w,
    	FIRST_VALUE(p.ratio_1) OVER w,
    	LAST_VALUE(p.ratio_1) OVER w,
    	MIN(p.ratio_2) OVER w,
    	MAX(p.ratio_2) OVER w,
    	FIRST_VALUE(p.ratio_2) OVER w,
    	LAST_VALUE(p.ratio_2) OVER w
    FROM pool_ratio(duration) AS p
    WINDOW w AS (PARTITION BY p.pool_id, p.timeframe, p.which_token ORDER BY p.timeframe);
  end; $$
  LANGUAGE plpgsql;

-- Additional pools for minute, hour and day candlestick data
CREATE VIEW pool_minute_candlestick AS
  SELECT * FROM pool_candlestick('minute');

CREATE VIEW pool_hour_candlestick AS
  SELECT * FROM pool_candlestick('hour');

CREATE VIEW pool_day_candlestick AS
  SELECT * FROM pool_candlestick('day');
  
-- Pool supply
CREATE FUNCTION pool_supply (
      duration text
    ) RETURNS TABLE (
      pool_id bigint,
      timeframe timestamptz,
      supply numeric,
      total_supply numeric
    )
    AS $$
    BEGIN
        RETURN QUERY
        SELECT
        	p.pool_id,
        	p.timeframe,
        	p.supply,
        	LAST_VALUE(p.total_supply) OVER w
        FROM pool_prepare_supply_data(duration) AS p
        WINDOW w AS (PARTITION BY p.pool_id, p.timeframe ORDER BY p.timeframe, p.pool_id);
    end; $$
    LANGUAGE plpgsql;

-- Pool supply views
CREATE VIEW pool_day_supply AS
  SELECT * FROM pool_supply('day');

CREATE VIEW pool_hour_supply AS
  SELECT * FROM pool_supply('hour');

CREATE VIEW pool_minute_supply AS
  SELECT * FROM pool_supply('minute');

-- Pool volume 

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
    	SUM(p.amount_1) OVER w,
    	SUM(p.amount_2) OVER w
    FROM pool_prepare_volume_data(duration) AS p
    WINDOW w AS (PARTITION BY p.timeframe, p.pool_id ORDER BY p.timeframe);
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
    fee_2 numeric
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
    timeframe timestamptz,
    fee_1 numeric,
    fee_2 numeric
  )
  AS $$
  BEGIN
    RETURN QUERY
    SELECT
    	p.pool_id,
    	p.timeframe,
    	SUM(p.fee_1) OVER w,
    	SUM(p.fee_2) OVER w
    FROM pool_prepare_fee_data(duration) AS p
    WINDOW w AS (PARTITION BY p.pool_id, p.timeframe ORDER BY p.timeframe);
  end; $$
  LANGUAGE plpgsql;

-- Pool fee views
CREATE VIEW pool_day_fee AS
  SELECT * FROM pool_fee('day');

CREATE VIEW pool_hour_fee AS
  SELECT * FROM pool_fee('hour');
  
CREATE VIEW pool_minute_fee AS
  SELECT * FROM pool_fee('minute');
