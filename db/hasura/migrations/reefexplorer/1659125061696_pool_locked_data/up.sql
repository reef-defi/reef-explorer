-- Pool locked data
CREATE FUNCTION pool_prepare_locked_data (
  duration text
)
  RETURNS TABLE (
  	exact_time timestamptz,
    timeframe timestamptz,
    pool_id bigint,
    reserved_1 numeric,
    reserved_2 numeric
  )
  AS $$
  BEGIN
    RETURN QUERY
    SELECT
      pe.timestamp,
      date_trunc(duration, pe.timestamp),
      pe.pool_id,
      pe.reserved_1,
      pe.reserved_2
    FROM pool_event as pe
    WHERE pe.type = 'Sync';
  end; $$
  LANGUAGE plpgsql;

-- Pool locked preprocessing function
CREATE FUNCTION pool_locked(
  duration text
)
  RETURNS TABLE (
  	pool_id bigint,
    timeframe timestamptz,
    reserved_1 numeric,
    reserved_2 numeric
  )
  AS $$
  BEGIN
    RETURN QUERY
    SELECT
      p.pool_id,
      p.timeframe,
      SUM(p.reserved_1),
      SUM(p.reserved_2)
    FROM pool_prepare_locked_data(duration) as p
    GROUP BY p.pool_id, p.timeframe
    ORDER BY p.timeframe;
  end; $$
  LANGUAGE plpgsql;

-- Pool locked views
CREATE VIEW pool_day_locked AS
  SELECT * FROM pool_locked('day');

CREATE VIEW pool_hour_locked AS
  SELECT * FROM pool_locked('hour');

CREATE VIEW pool_minute_locked AS
  SELECT * FROM pool_locked('minute');
