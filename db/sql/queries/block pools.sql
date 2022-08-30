-- /* Dropping tables */
-- DROP TABLE candlestick;
-- DROP TABLE volume;
-- DROP TABLE locked;
-- DROP TABLE pool_token;
-- DROP TABLE price;
-- DROP TABLE block;
-- DROP TABLE pool;
-- DROP TABLE evm_event;
-- DROP TABLE verified_contract;
-- DROP TYPE tokenholdertype;

-- -- helper tables for new tables
-- CREATE TABLE block (
--   id SERIAL PRIMARY KEY,
--   timestamp timestamptz NOT NULL
-- );

-- CREATE TABLE pool (
--   id SERIAL PRIMARY KEY,
--   timestamp timestamptz NOT NULL
-- );

-- CREATE TABLE evm_event (
--   id SERIAL PRIMARY KEY,
--   timestamp timestamptz NOT NULL
-- );

-- CREATE TABLE verified_contract(
--   address CHAR(42) NOT NULL PRIMARY KEY
-- );

-- Dropping old views-- Dropping pool views
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


-- New tables
CREATE TABLE token_price(
  id SERIAL PRIMARY KEY,
  block_id INT NOT NULL,
  token_address CHAR(42) NOT NULL,
  price numeric NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  
  FOREIGN KEY (block_id) REFERENCES block(id) ON DELETE CASCADE,
  FOREIGN KEY (token_address) REFERENCES verified_contract(address) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS token_price_block_id_idx ON token_price(block_id);
CREATE INDEX IF NOT EXISTS token_price_token_address_idx ON token_price(token_address);
CREATE INDEX IF NOT EXISTS token_price_timestamp_idx ON token_price(timestamp);

CREATE TABLE candlestick(
  id Serial PRIMARY KEY,
  
  block_id INT NOT NULL,
  pool_id INT NOT NULL,
  token_address CHAR(42) NOT NULL,
  evm_event_id INT, -- Optional link to evm event
  
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  
  FOREIGN key (pool_id) REFERENCES pool(id) ON DELETE CASCADE,
  FOREIGN key (block_id) REFERENCES block(id) ON DELETE CASCADE,
  FOREIGN key (evm_event_id) REFERENCES evm_event(id) ON DELETE CASCADE,
  FOREIGN key (token_address) REFERENCES verified_contract(address) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS candlestick_block_id_idx ON candlestick(block_id);
CREATE INDEX IF NOT EXISTS candlestick_pool_id_idx ON candlestick(pool_id);
CREATE INDEX IF NOT EXISTS candlestick_token_address_idx ON candlestick(token_address);
CREATE INDEX IF NOT EXISTS candlestick_timestamp_idx ON candlestick(timestamp);
CREATE INDEX IF NOT EXISTS candlestick_evm_event_id_idx ON candlestick(evm_event_id);

CREATE TABLE locked_raw(
  id Serial PRIMARY KEY,
  
  block_id INT NOT NULL,
  pool_id INT NOT NULL,
  evm_event_id INT, -- Optional link to evm event
  
  locked_1 NUMERIC NOT NULL,
  locked_2 NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  
  FOREIGN key (pool_id) REFERENCES pool(id) ON DELETE CASCADE,
  FOREIGN key (block_id) REFERENCES block(id) ON DELETE CASCADE,
  FOREIGN key (evm_event_id) REFERENCES evm_event(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS locked_block_id_idx ON locked(block_id);
CREATE INDEX IF NOT EXISTS locked_pool_id_idx ON locked(pool_id);
CREATE INDEX IF NOT EXISTS locked_evm_event_id_idx ON locked(evm_event_id);
CREATE INDEX IF NOT EXISTS locked_timestamp_idx ON locked(timestamp);


CREATE TABLE volume(
  id Serial PRIMARY KEY,
  
  block_id INT NOT NULL,
  pool_id INT NOT NULL,
  evm_event_id INT, -- Optional link to evm event
  
  volume_1 NUMERIC NOT NULL,
  volume_2 NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  
  FOREIGN key (pool_id) REFERENCES pool(id) ON DELETE CASCADE,
  FOREIGN key (block_id) REFERENCES block(id) ON DELETE CASCADE,
  FOREIGN key (evm_event_id) REFERENCES evm_event(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS volume_block_id_idx ON volume(block_id);
CREATE INDEX IF NOT EXISTS volume_pool_id_idx ON volume(pool_id);
CREATE INDEX IF NOT EXISTS volume_evm_event_id_idx ON volume(evm_event_id);
CREATE INDEX IF NOT EXISTS volume_timestamp_idx ON volume(timestamp);


CREATE TYPE tokenholdertype AS ENUM (
    'Account',
    'Contract'
);
CREATE TABLE pool_token(
  id Serial PRIMARY KEY,

  block_id INT NOT NULL,  
  pool_id INT NOT NULL,
  evm_event_id INT, -- Optional link to evm event

  supply NUMERIC NOT NULL,
  type tokenholdertype NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,

  Foreign key (block_id) REFERENCES block(id) ON DELETE CASCADE,
  FOREIGN key (pool_id) REFERENCES pool(id) ON DELETE CASCADE,
  FOREIGN key (evm_event_id) REFERENCES evm_event(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS pool_token_block_id_idx ON pool_token(block_id);
CREATE INDEX IF NOT EXISTS pool_token_pool_id_idx ON pool_token(pool_id);
CREATE INDEX IF NOT EXISTS pool_token_evm_event_id_idx ON pool_token(evm_event_id);
CREATE INDEX IF NOT EXISTS pool_token_timestamp_idx ON pool_token(timestamp);
CREATE INDEX IF NOT EXISTS pool_token_type_idx ON pool_token(type); 

-- New views
-- Function applies date trunc over timestamp, which we can use in window functions
CREATE FUNCTION volume_prepare_raw (duration: string)
  RETURNS TABLE (
    pool_id INT,
    volume_1 NUMERIC,
    volume_2 NUMERIC,
    timestamp TIMESTAMPTZ
  ) AS $$
  SELECT 
    pool_id,
    volume_1,
    volume_2,
    date_trunc(duration, timestamp)
  FROM volume
  ORDER BY timestamp
  END;
$$ LANGUAGE SQL;

-- Applying window function over volume_prepare_raw function
-- Volume is calculated as sum of volume_1 and volume_2
CREATE FUNCTION volume_window_raw (duration: string)
  RETURNS TABLE (
    pool_id INT,
    volume_1 NUMERIC,
    volume_2 NUMERIC,
    timestamp TIMESTAMPTZ
  ) AS $$
   SELECT
      v.pool_id,
      SUM(v.volume_1) OVER w,
      SUM(v.volume_2) OVER w,
      v.timeframe
    FROM volume_prepare_raw(duration) AS v
    WINDOW w AS (PARTITION BY v.pool_id, v.timeframe ORDER BY v.timeframe, v.pool_id);
  END;
$$ LANGUAGE SQL;

CREATE VIEW volume_raw_min AS SELECT * FROM volume_window_raw('minute');
CREATE VIEW volume_raw_hour AS SELECT * FROM volume_window_raw('hour');
CREATE VIEW volume_raw_day AS SELECT * FROM volume_window_raw('day');
CREATE VIEW volume_raw_week AS SELECT * FROM volume_window_raw('week');

-- Function applies date trunc over timestamp, which we can use in window functions
CREATE FUNCTION locked_prepare_raw (duration: string)
  RETURNS TABLE (
    pool_id INT,
    locked_1 NUMERIC,
    locked_2 NUMERIC,
    timestamp TIMESTAMPTZ
  ) AS $$
  SELECT 
    pool_id,
    locked_1,
    locked_2,
    date_trunc(duration, timestamp)
  FROM locked_raw
  ORDER BY timestamp
  END;
$$ LANGUAGE SQL;

-- Applying window function over locked_prepare_raw function
-- last locked values are used as reserve
CREATE FUNCTION locked_window_raw (duration: string)
  RETURNS TABLE (
    pool_id INT,
    locked_1 NUMERIC,
    locked_2 NUMERIC,
    timestamp TIMESTAMPTZ
  ) AS $$
   SELECT
      l.pool_id,
      LAST(l.locked_1) OVER w,
      LAST(l.locked_2) OVER w,
      l.timeframe
    FROM locked_prepare_raw(duration) AS l
    WINDOW w AS (PARTITION BY l.pool_id, l.timeframe ORDER BY l.timeframe, l.pool_id);
  END;
$$ LANGUAGE SQL;

CREATE VIEW locked_raw_min AS SELECT * FROM locked_window_raw('minute');
CREATE VIEW locked_raw_hour AS SELECT * FROM locked_window_raw('hour');
CREATE VIEW locked_raw_day AS SELECT * FROM locked_window_raw('day');
CREATE VIEW locked_raw_week AS SELECT * FROM locked_window_raw('week');

-- Function applies date trunc over timestamp, which we can use in window functions
CREATE FUNCTION token_price_prepare (duration: string)
  RETURNS TABLE (
    token_address INT,
    price NUMERIC,
    timestamp TIMESTAMPTZ
  ) AS $$
  SELECT 
    pool_id,
    price,
    date_trunc(duration, timestamp)
  FROM pool_token
  ORDER BY timestamp
  END;
$$ LANGUAGE SQL;

-- Applying window function over price_prepare function
-- Price is calculated as last price in pool
CREATE FUNCTION token_price_window (duration: string)
  RETURNS TABLE (
    pool_id INT,
    price NUMERIC,
    timestamp TIMESTAMPTZ
  ) AS $$
   SELECT
      p.pool_id,
      LAST(p.price) OVER w,
      p.timeframe
    FROM token_price_prepare(duration) AS p
    WINDOW w AS (PARTITION BY p.pool_id, p.timeframe ORDER BY p.timeframe, p.pool_id);
  END;
$$ LANGUAGE SQL;

CREATE VIEW token_price_min AS SELECT * FROM token_price_window('minute');
CREATE VIEW token_price_hour AS SELECT * FROM token_price_window('hour');
CREATE VIEW token_price_day AS SELECT * FROM token_price_window('day');
CREATE VIEW token_price_week AS SELECT * FROM token_price_window('week');

-- Calling volume window raw and multiplying volumes by 0.3% to get a fee
CREATE FUNCTION fee_window_raw (duration: string)
  RETURNS TABLE (
    pool_id INT,
    fee_1 NUMERIC,
    fee_2 NUMERIC,
    timestamp TIMESTAMPTZ
  ) AS $$
   SELECT
      f.pool_id,
      volume_1 * 0.0003,
      volume_2 * 0.0003,
      f.timeframe
    FROM volume_window_raw(duration)
  END;
$$ LANGUAGE SQL;

CREATE VIEW fee_raw_min AS SELECT * FROM fee_window_raw('minute');
CREATE VIEW fee_raw_hour AS SELECT * FROM fee_window_raw('hour');
CREATE VIEW fee_raw_day AS SELECT * FROM fee_window_raw('day');
CREATE VIEW fee_raw_week AS SELECT * FROM fee_window_raw('week');


-- Function applies date trunc over timestamp, which we can use in window functions
CREATE FUNCTION candlestick_prepare (duration: string)
  RETURNS TABLE (
    pool_id INT,
    open NUMERIC,
    high NUMERIC,
    low NUMERIC,
    close NUMERIC,
    timestamp TIMESTAMPTZ
  ) AS $$
  SELECT 
    pool_id,
    open,
    high,
    low,
    close,
    date_trunc(duration, timestamp)
  FROM pool_token
  ORDER BY timestamp
  END;
$$ LANGUAGE SQL;

-- Applying window function over candlestick_prepare function extracting open, high, low, close
CREATE FUNCTION candlestick_window (duration: string)
  RETURNS TABLE (
    pool_id INT,
    open NUMERIC,
    high NUMERIC,
    low NUMERIC,
    close NUMERIC,
    timestamp TIMESTAMPTZ
  ) AS $$
   SELECT
      c.pool_id,
      FIRST(c.open) OVER w,
      MAX(c.high) OVER w,
      MIN(c.low) OVER w,
      LAST(c.close) OVER w,
      c.timeframe
    FROM candlestick_prepare(duration) AS c
    WINDOW w AS (PARTITION BY c.pool_id, c.timeframe ORDER BY c.timeframe, c.pool_id);
  END;
$$ LANGUAGE SQL;

CREATE VIEW candlestick_min AS 
  SELECT * FROM candlestick_window('minute');
CREATE VIEW candlestick_hour AS 
  SELECT * FROM candlestick_window('hour');
CREATE VIEW candlestick_day AS 
  SELECT * FROM candlestick_window('day');
CREATE VIEW candlestick_week AS 
  SELECT * FROM candlestick_window('week');

-- Pool volume combined with price for each pool and block
CREATE VIEW volume AS
  SELECT 
    vl.block_id,
    vl.pool_id,
    vl.timestamp,
    vl.volume_1 * tp1.price + vl.volume_2 * tp2.price AS volume,
  FROM volume_raw AS vr
  JOIN pool AS p ON 
    vl.pool_id = p.id
  JOIN token_price as tp1 ON 
    p.token_1 = tp1.token_address AND
    vl.block_id = tp1.block_id
  JOIN token_price as tp2 ON
    p.token_2 = tp2.token_address AND
    vl.block_id = tp2.block_id;

-- Preparing pool volume for window aggregation through date trunc
CREATE FUNCTION volume_prepare (duration: string)
  RETURNS TABLE (
    pool_id INT,
    volume NUMERIC,
    timestamp TIMESTAMPTZ
  ) AS $$
  SELECT 
    pool_id,
    volume,
    date_trunc(duration, timestamp)
  FROM volume;
  END;
$$ LANGUAGE SQL;

-- Applying window function over pool_volume_prepare function and summing volume
CREATE FUNCTION volume_window (duration: string)
  RETURNS TABLE (
    pool_id INT,
    volume NUMERIC,
    timestamp TIMESTAMPTZ
  ) AS $$
   SELECT
      p.pool_id,
      SUM(p.volume) OVER w,
      p.timeframe
    FROM volume_prepare(duration) AS p
    WINDOW w AS (PARTITION BY p.pool_id, p.timeframe ORDER BY p.timeframe, p.pool_id);
  END;
$$ LANGUAGE SQL;

-- Pool volume combined with price for minute, hour, day, week
CREATE VIEW volume_min AS SELECT * FROM pool_volume_window('minute');
CREATE VIEW volume_hour AS SELECT * FROM pool_volume_window('hour');
CREATE VIEW volume_day AS SELECT * FROM pool_volume_window('day');
CREATE VIEW volume_week AS SELECT * FROM pool_volume_window('week');

-- Pool locked supply combined with price for each pool and block
CREATE VIEW locked AS
  SELECT 
    l.block_id,
    l.pool_id,
    l.timestamp,
    l.locked_1 * tp1.price + l.locked_2 * tp2.price AS locked,
  FROM locked_raw as l
  JOIN pool as p ON
    l.pool_id = p.id
  JOIN token_price as tp1 ON
    p.token_1 = tp1.token_address AND
    l.block_id = tp1.block_id
  JOIN token_price as tp2 ON
    p.token_2 = tp2.token_address AND
    l.block_id = tp2.block_id;

-- Preparing pool locked supply for window aggregation through date trunc
CREATE FUNCTION locked_prepare (duration: string)
  RETURNS TABLE (
    pool_id INT,
    locked NUMERIC,
    timestamp TIMESTAMPTZ
  ) AS $$
  SELECT 
    pool_id,
    locked,
    date_trunc(duration, timestamp)
  FROM locked
  ORDER BY timestamp;
  END;
$$ LANGUAGE SQL;

-- Applying window function over pool_locked_prepare function and summing locked
CREATE FUNCTION locked_window (duration: string)
  RETURNS TABLE (
    pool_id INT,
    locked NUMERIC,
    timestamp TIMESTAMPTZ
  ) AS $$
   SELECT
      p.pool_id,
      LAST(p.locked) OVER w,
      p.timeframe
    FROM locked_prepare(duration) AS p
    WINDOW w AS (PARTITION BY p.pool_id, p.timeframe ORDER BY p.timeframe, p.pool_id);
  END;
$$ LANGUAGE SQL;

-- Pool locked supply combined with price for minute, hour, day, week
CREATE VIEW locked_min AS SELECT * FROM locked_window('minute');
CREATE VIEW locked_hour AS SELECT * FROM locked_window('hour');
CREATE VIEW locked_day AS SELECT * FROM locked_window('day');
CREATE VIEW locked_week AS SELECT * FROM locked_window('week');
