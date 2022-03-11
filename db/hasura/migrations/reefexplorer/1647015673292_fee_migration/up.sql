DROP VIEW pool_minute_fee;
DROP VIEW pool_hour_fee;
DROP VIEW pool_day_fee;

DROP FUNCTION pool_fee;
DROP FUNCTION pool_prepare_fee_data;

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
      org.pool_id,
      org.timeframe,
      SUM(org.fee_1),
      SUM(org.fee_2)
    FROM pool_prepare_fee_data(duration) as org
    GROUP BY org.pool_id, org.timeframe
    ORDER BY org.timeframe;
  end; $$
  LANGUAGE plpgsql;

CREATE VIEW pool_day_fee AS
  SELECT * FROM pool_fee('day');

CREATE VIEW pool_hour_fee AS
  SELECT * FROM pool_fee('hour');
  
CREATE VIEW pool_minute_fee AS
  SELECT * FROM pool_fee('minute');
