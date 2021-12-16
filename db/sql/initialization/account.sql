CREATE TABLE IF NOT EXISTS account (
  block_id BIGINT,
  address VARCHAR(48),
  evm_address VARCHAR(42), -- TODO maybe we can add also address as Primary Key

  identity VARCHAR,
  active BOOLEAN NOT NULL,
  free_balance NUMERIC(80,0) NOT NULL,
  locked_balance NUMERIC(80,0) NOT NULL,
  available_balance NUMERIC(80,0) NOT NULL,

  timestamp timestamp default current_timestamp,

  PRIMARY KEY (address),
  CONSTRAINT fk_block
    FOREIGN KEY(block_id)
      REFERENCES block(id)
      ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS account_active ON account (active);
CREATE INDEX IF NOT EXISTS account_block_id ON account (block_id);
CREATE INDEX IF NOT EXISTS account_evm_address ON account (evm_address);

-- Inserting chain account
INSERT INTO account 
  (block_id, evm_address, address, active, available_balance, free_balance, locked_balance)
VALUES
  (-1, '0x', '0x', true, 0, 0, 0),
  (-1, 'deleted', 'deleted', true, 0, 0, 0);