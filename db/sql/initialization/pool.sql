
CREATE TABLE IF NOT EXISTS pool (
  address VARCHAR(48) NOT NULL,
  token_1 VARCHAR(48) NOT NULL,
  token_2 VARCHAR(48) NOT NULL,

  CONSTRAINT fk_block
    FOREIGN KEY(block_id)
      REFERENCES block(id)
      ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS pool_reserved_1 ON pool (reserved_1);
CREATE INDEX IF NOT EXISTS pool_reserved_2 ON pool (reserved_2);
CREATE INDEX IF NOT EXISTS pool_reserved_2 ON pool (reserved_2);


CREATE TYPE PoolType As Enum('Mint', 'Burn', 'Swap');

CREATE SEQUENCE pool_event_serail_id START -1;

CREATE TABLE IF NOT EXISTS pool_event (
  id BIGSERIAL, -- TODO Do we need it as a primary key?
  evm_event_id BIGINT NOT NULL,

  address VARCHAR(48) NOT NULL, -- ???

  to VARCHAR(48),
  type PoolType NOT NULL,
  sender VARCHAR(48) NOT NUll,

  amount_1 NUMERIC(80, 0) NOT NULL,
  amount_2 NUMERIC(80, 0) NOT NULL,

  amount_in_1 NUMERIC(80, 0),
  amount_in_2 NUMERIC(80, 0),

  -- Reserved fields indicate 
  -- TODO Do we have this info in harvesting???
  -- reserved_1 NUMERIC(80, 0) NOT NULL,
  -- reserved_2 NUMERIC(80, 0) NOT NULL,

  timestamp timestamptz NOT NULL,

  CONSTRAINT fk_event
    FOREIGN KEY(evm_event_id)
      REFERENCES evm_event(id)
      ON DELETE CASCADE,
  CONSTRAINT fk_pool
    FOREIGN KEY(evm_event_id)
      REFERENCES evm_event(id)
      ON DELETE CASCADE
)

-- TODO pool data view with data aggregation
-- CREATE VIEW pool_data AS 
--   SELECT * FROM pool_event