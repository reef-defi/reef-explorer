CREATE TABLE IF NOT EXISTS pool (
  id BIGSERIAL,
  
  evm_event_id BIGINT NOT NULL,
  address VARCHAR(48) NOT NULL,
  token_1 VARCHAR(48) NOT NULL,
  token_2 VARCHAR(48) NOT NULL,

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

CREATE INDEX IF NOT EXISTS pool_address ON pool (address);
CREATE INDEX IF NOT EXISTS pool_token_1 ON pool (token_1);
CREATE INDEX IF NOT EXISTS pool_token_2 ON pool (token_2);
CREATE INDEX IF NOT EXISTS pool_evm_event_id ON pool (evm_event_id);


CREATE TYPE PoolType As Enum('Mint', 'Burn', 'Swap', 'Sync');
CREATE SEQUENCE pool_event_sequence START 1;

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

  timestamp timestamptz NOT NULL,

  CONSTRAINT fk_event
    FOREIGN KEY(evm_event_id)
      REFERENCES evm_event(id)
      ON DELETE CASCADE,
  CONSTRAINT fk_pool
    FOREIGN KEY(pool_id)
      REFERENCES pool(id)
      ON DELETE CASCADE
);

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


CREATE FUNCTION pool_ratio (
  duration text
)
  RETURNS TABLE (
    pool_id BIGINT, 
    timeframe timestamptz,
    exact_time timestamptz,
    token_1_ratio decimal,
    token_2_ratio decimal,
    which_token int
  )
  as $$
  begin
    return query
    SELECT 
      pe.pool_id as pool_id,
      date_trunc(duration, pe.timestamp) as timeframe,
      pe.timestamp as exact_time,
      (
        CASE 
          WHEN pe.amount_in_2 > 0
          THEN pe.amount_1/pe.amount_in_2
          ELSE 1
        END
      ) as token_1_ratio,
      (
        CASE
          WHEN pe.amount_in_1 > 0
          THEN pe.amount_2/pe.amount_in_1
          ELSE 1
        END
      ) as token_2_ratio,
      (
        CASE
          WHEN pe.amount_in_2 > 0
          THEN 1
          ELSE 2
        END
      ) as which_token
    FROM pool_event as pe
    WHERE pe.type = 'Swap'
    ORDER BY pe.timestamp;
  end; $$
  LANGUAGE plpgsql;
  

CREATE FUNCTION pool_candlestick (
  duration text
)
  RETURNS TABLE (
    timeframe timestamptz,
    pool_id BIGINT,
    which_token int,
    low_ratio_token_1 decimal,
    high_ratio_token_1 decimal,
    low_ratio_token_2 decimal,
    high_ratio_token_2 decimal,
    open_ratio_token_1 decimal,
    close_ratio_token_1 decimal,
    open_ratio_token_2 decimal,
    close_ratio_token_2 decimal
  )
  AS $$
  BEGIN
    RETURN QUERY  
    SELECT 
      org.timeframe,
      org.pool_id,
      org.which_token as which_token,
      MIN(org.token_1_ratio) as low_ratio_token_1,
      MAX(org.token_1_ratio) as high_ratio_token_1,
      MIN(org.token_2_ratio) as low_ratio_token_2,
      MAX(org.token_2_ratio) as high_ratio_token_2,
      -- TODO maybe place below distint selects into one function? 
      (
        SELECT DISTINCT ON (sub.timeframe)
          sub.token_1_ratio
        FROM pool_ratio(duration) as sub
        WHERE 
          org.timeframe = sub.timeframe AND 
          MIN(org.exact_time) = sub.exact_time
      ) as opened_token_1_ratio,
      (
        SELECT DISTINCT ON (sub.timeframe)
          sub.token_1_ratio
        FROM pool_ratio(duration) as sub
        WHERE 
          org.timeframe = sub.timeframe AND 
          MAX(org.exact_time) = sub.exact_time
      ) as closed_token_1_ratio,
      (
        SELECT DISTINCT ON (sub.timeframe)
          sub.token_2_ratio
        FROM pool_ratio(duration) as sub
        WHERE 
          org.timeframe = sub.timeframe AND 
          MIN(org.exact_time) = sub.exact_time
      ) as opened_token_2_ratio,
      (
        SELECT DISTINCT ON (sub.timeframe)
          sub.token_2_ratio
        FROM pool_ratio(duration) as sub
        WHERE 
          org.timeframe = sub.timeframe AND 
          MAX(org.exact_time) = sub.exact_time
      ) as closed_token_2_ratio
    FROM pool_ratio(duration) as org
    GROUP BY org.timeframe, org.pool_id, org.which_token
    ORDER BY org.pool_id, org.timeframe;
  end; $$
  LANGUAGE plpgsql;

CREATE VIEW pool_minute_candlestick AS
  SELECT * FROM pool_candlestick('minute');

CREATE VIEW pool_hour_candlestick AS
  SELECT * FROM pool_candlestick('hour');

CREATE VIEW pool_day_candlestick AS
  SELECT * FROM pool_candlestick('day');
  