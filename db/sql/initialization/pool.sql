CREATE TYPE PoolType As Enum('Mint', 'Burn', 'Swap', 'Sync');

CREATE SEQUENCE pool_event_sequence START 1;

CREATE TABLE IF NOT EXISTS pool (
  id BIGSERIAL,
  
  evm_event_id BIGINT NOT NULL,
  address VARCHAR(48) NOT NULL,
  token_1 VARCHAR(48) NOT NULL,
  token_2 VARCHAR(48) NOT NULL,

  pool_decimal INT NOT NULL,
  decimal_1 INT NOT NULL,
  decimal_2 INT NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_evm_event
    FOREIGN KEY(evm_event_id)
      REFERENCES evm_event(id)
      ON DELETE CASCADE,
  -- TODO When evm lib will detect creation of sub-contracts add the following foreign key
  -- CONSTRAINT fk_contract
  --   FOREIGN KEY(address)
  --     REFERENCES contract(address)
  --     ON DELETE CASCADE,
  CONSTRAINT fk_token_1
    FOREIGN KEY(token_1)
      REFERENCES contract(address)
      ON DELETE CASCADE,
  CONSTRAINT fk_token_2
    FOREIGN KEY(token_2)
      REFERENCES contract(address)
      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pool_event (
  id BIGSERIAL, -- TODO Do we need it as a primary key?
  pool_id BIGINT NOT NULL,
  evm_event_id BIGINT NOT NULL,

  to_address VARCHAR(48),
  sender_address VARCHAR(48),
  type PoolType NOT NULL,

  amount_1 NUMERIC(80, 0),
  amount_2 NUMERIC(80, 0),

  amount_in_1 NUMERIC(80, 0),
  amount_in_2 NUMERIC(80, 0),

  reserved_1 NUMERIC(80, 0),
  reserved_2 NUMERIC(80, 0),
  total_supply NUMERIC(80, 0),

  timestamp timestamptz NOT NULL,

  PRIMARY KEY (id),

  CONSTRAINT fk_event
    FOREIGN KEY(evm_event_id)
      REFERENCES evm_event(id)
      ON DELETE CASCADE,
  CONSTRAINT fk_pool
    FOREIGN KEY(pool_id)
      REFERENCES pool(id)
      ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS pool_address ON pool (address);
CREATE INDEX IF NOT EXISTS pool_token_1 ON pool (token_1);
CREATE INDEX IF NOT EXISTS pool_token_2 ON pool (token_2);
CREATE INDEX IF NOT EXISTS pool_evm_event_id ON pool (evm_event_id);

CREATE INDEX IF NOT EXISTS pool_event_type ON pool_event(type);
CREATE INDEX IF NOT EXISTS pool_event_pool_id ON pool_event(pool_id);
CREATE INDEX IF NOT EXISTS pool_event_amount_1 ON pool_event(amount_1);
CREATE INDEX IF NOT EXISTS pool_event_amount_2 ON pool_event(amount_2);
CREATE INDEX IF NOT EXISTS pool_event_timestamp ON pool_event(timestamp);
CREATE INDEX IF NOT EXISTS pool_event_reserved_1 ON pool_event(reserved_1);
CREATE INDEX IF NOT EXISTS pool_event_reserved_2 ON pool_event(reserved_2);
CREATE INDEX IF NOT EXISTS pool_event_to_address ON pool_event(to_address);
CREATE INDEX IF NOT EXISTS pool_event_amount_in_1 ON pool_event(amount_in_1);
CREATE INDEX IF NOT EXISTS pool_event_amount_in_2 ON pool_event(amount_in_2);
CREATE INDEX IF NOT EXISTS pool_event_evm_event_id ON pool_event(evm_event_id);
CREATE INDEX IF NOT EXISTS pool_event_sender_address ON pool_event(sender_address);

-- Pool ratio function prepares pool info in intermediat structure for easier candlestick calculatin
-- Currenty ratio is calculated betweem reserves of token 1 and reserves of token 2
-- CREATE FUNCTION pool_ratio (
--   duration text
-- )
--   RETURNS TABLE (
--     pool_id BIGINT, 
--     timeframe timestamptz,
--     exact_time timestamptz,
--     ratio_1 decimal,
--     ratio_2 decimal
--   )
--   as $$
--   begin
--     return query
--     SELECT 
--       pe.pool_id,
--       date_trunc(duration, pe.timestamp),
--       pe.timestamp,
--       (
--         pe.reserved_1 / POWER(10, pl.decimal_1)::decimal
--       ) / (
--         pe.reserved_2 / POWER(10, pl.decimal_2)::decimal
--       ),
--       (
--         pe.reserved_2 / POWER(10, pl.decimal_2)::decimal
--       ) / (
--         pe.reserved_1 / POWER(10, pl.decimal_1)::decimal
--       )
--     FROM pool_event as pe
--     JOIN pool as pl
--       ON pe.pool_id = pl.id
--     WHERE pe.type = 'Sync'
--     ORDER BY pe.timestamp;
--   end; $$
--   LANGUAGE plpgsql;

-- Additional pool ratio function, which calculates the ratio between buy and sell amount
-- It has an additional field (which_token) to indicate for which token ration was calculated
CREATE FUNCTION pool_ratio (
  duration text
)
  RETURNS TABLE (
    pool_id BIGINT, 
    timeframe timestamptz,
    exact_time timestamptz,
    ratio_1 decimal,
    ratio_2 decimal,
    which_token int
  )
  as $$
  begin
    return query
    SELECT 
      pe.pool_id,
      date_trunc(duration, pe.timestamp),
      pe.timestamp,
      (
        CASE 
        WHEN pe.amount_in_2 > 0
        THEN (
          pe.amount_1 / POWER(10, pl.decimal_1)::decimal
        ) / (
          pe.amount_in_2 / POWER(10, pl.decimal_2)::decimal
        )
        ELSE -1
        END
      ),
      (
        CASE
          WHEN pe.amount_in_1 > 0
          THEN (
            pe.amount_2 / POWER(10, pl.decimal_2)::decimal
          ) / (
            pe.amount_in_1 / POWER(10, pl.decimal_1)::decimal
          )
          ELSE 1
        END
      ) as token_2_ratio,
      (
        CASE
          WHEN pe.amount_in_2 > 0
          THEN 1
          ELSE 2
        END
      ) 
    FROM pool_event as pe
    JOIN pool as pl
      ON pe.pool_id = pl.id
    WHERE pe.type = 'Swap'
    ORDER BY pe.timestamp;
  end; $$
  LANGUAGE plpgsql;



-- Pool candlestick function groups by pool events by timeframe and pool id and find their Max, min , first and last values
-- CREATE FUNCTION pool_candlestick (
--   duration text
-- )
--   RETURNS TABLE (
--     timeframe timestamptz,
--     pool_id BIGINT,
--     low_1 decimal,
--     high_1 decimal,
--     low_2 decimal,
--     high_2 decimal,
--     open_1 decimal,
--     close_1 decimal,
--     open_2 decimal,
--     close_2 decimal
--   )
--   AS $$
--   BEGIN
--     RETURN QUERY  
--     SELECT 
--       org.timeframe,
--       org.pool_id,
--       MIN(org.ratio_1),
--       MAX(org.ratio_1),
--       MIN(org.ratio_2),
--       MAX(org.ratio_2),
--       (
--         SELECT DISTINCT ON (sub.timeframe)
--           sub.ratio_1
--         FROM pool_ratio(duration) as sub
--         WHERE 
--           org.timeframe = sub.timeframe AND 
--           MIN(org.exact_time) = sub.exact_time
--       ),
--       (
--         SELECT DISTINCT ON (sub.timeframe)
--           sub.ratio_1
--         FROM pool_ratio(duration) as sub
--         WHERE 
--           org.timeframe = sub.timeframe AND 
--           MAX(org.exact_time) = sub.exact_time
--       ),
--       (
--         SELECT DISTINCT ON (sub.timeframe)
--           sub.ratio_2
--         FROM pool_ratio(duration) as sub
--         WHERE 
--           org.timeframe = sub.timeframe AND 
--           MIN(org.exact_time) = sub.exact_time
--       ),
--       (
--         SELECT DISTINCT ON (sub.timeframe)
--           sub.ratio_2
--         FROM pool_ratio(duration) as sub
--         WHERE 
--           org.timeframe = sub.timeframe AND 
--           MAX(org.exact_time) = sub.exact_time
--       )
--     FROM pool_ratio(duration) as org
--     GROUP BY org.timeframe, org.pool_id
--     ORDER BY org.pool_id, org.timeframe;
--   end; $$
--   LANGUAGE plpgsql;

-- Additional pool_candlestick that evaluates buy/sell ratios
-- It has an additional field "which_token" to indicate for which token ration was calculated
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

-- Pool volume data
CREATE VIEW pool_volume AS 
  SELECT
    pool_id,
    timestamp,
    reserved_1,
    reserved_2,
    total_supply
  FROM pool_event
  WHERE type = 'Sync';
