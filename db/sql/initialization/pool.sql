
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

-- TODO pool data view with data aggregation
-- CREATE VIEW pool_data AS 
--   SELECT * FROM pool_event