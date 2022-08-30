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
CREATE TABLE price(
  ID SERIAL PRIMARY KEY,
  block_id INT NOT NULL,
  token_address CHAR(42) NOT NULL,
  price numeric NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  
  FOREIGN KEY (block_id) REFERENCES block(id) ON DELETE CASCADE,
  FOREIGN KEY (token_address) REFERENCES verified_contract(address) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS price_block_id_idx ON price(block_id);
CREATE INDEX IF NOT EXISTS price_token_address_idx ON price(token_address);
CREATE INDEX IF NOT EXISTS price_timestamp_idx ON price(timestamp);

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

CREATE TABLE locked(
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















/* Populating tables */
-- INSERT INTO block (timestamp) VALUES (NOW()), (NOW()), (NOW()), (NOW()), (NOW());
-- INSERT INTO pool (timestamp) VALUES (NOW()), (NOW()), (NOW());
-- INSERT INTO evm_event (timestamp) VALUES (NOW()), (NOW()), (NOW());

-- INSERT INTO verified_contract 
--   (address)
-- VALUES
--   ('token1'),
--   ('token2'),
--   ('token3'),
--   ('token4');
  
-- INSERT INTO price
--   (block_id, token_address, price, timestamp)
-- VALUES
--   (1, 'token1', 11.5, NOW()),
--   (2, 'token1', 12.5, NOW()),
--   (3, 'token1', 13.5, NOW()),
--   (4, 'token1', 14.5, NOW()),
--   (5, 'token1', 15.5, NOW()),
--   (1, 'token2', 6.1, NOW()),
--   (2, 'token2', 5.1, NOW()),
--   (2, 'token2', 23.1, NOW()),
--   (3, 'token3', 13.1, NOW()),
--   (3, 'token4', 3.1, NOW());
  
-- -- Cascade test
-- -- DELETE FROM block WHERE id = 3;
-- -- SELECT * FROM price;

-- INSERT INTO candlestick
--   (block_id, pool_id, evm_event_id, token_address, open, high, low, close, timestamp)
-- VALUES
--   (1, 1, null, 'token1', 1, 3, 2, 2.5, NOW()),
--   (2, 1, null, 'token1', 1, 3, 2, 2.5, NOW()),
--   (3, 2, 1, 'token3', 1, 3, 2, 2.5, NOW()),
--   (3, 2, 2, 'token2', 1, 3, 2, 2.5, NOW());

-- -- Cascade test for verified contract
-- --DELETE FROM verified_contract WHERE address = 'token1';
-- -- SELECT * FROM candlestick;

-- INSERT INTO locked
--   (block_id, pool_id, evm_event_id, locked_1, locked_2, timestamp)
-- VALUES
--   (1, 1, null, 1, 2, NOW()),
--   (2, 1, null, 1, 2, NOW()),
--   (3, 2, 1, 1, 2, NOW());

-- INSERT INTO volume
--   (block_id, pool_id, evm_event_id, volume_1, volume_2, timestamp)
-- VALUES
--   (1, 1, null, 1, 2, NOW()),
--   (2, 1, null, 1, 2, NOW()),
--   (3, 2, 1, 1, 2, NOW());

-- INSERT INTO pool_token
--   (block_id, pool_id, evm_event_id, supply, type, timestamp)
-- VALUES
--   (1, 1, null, 1, 'Account', NOW()),
--   (2, 1, null, 1, 'Account', NOW()),
--   (3, 2, 1, 1, 'Contract', NOW());
  