CREATE TABLE IF NOT EXISTS account (
  block_id BIGINT,
  address VARCHAR(48),
  evm_address VARCHAR(42), -- TODO maybe we can add also address as Primary Key

  identity JSON,

  active BOOLEAN NOT NULL,
  free_balance NUMERIC(80,0) NOT NULL,
  locked_balance NUMERIC(80,0) NOT NULL,
  available_balance NUMERIC(80,0) NOT NULL,
  reserved_balance NUMERIC(80,0) NOT NULL,
  vested_balance NUMERIC(80,0) NOT NULL,
  voting_balance NUMERIC(80,0) NOT NULL,
  
  nonce BIGINT NOT NULL,
  evm_nonce BIGINT NOT NULL,

  timestamp timestamptz NOT NULL,

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
  (block_id, evm_address, address, active, available_balance, free_balance, locked_balance, reserved_balance, vested_balance, voting_balance, nonce, evm_nonce, timestamp)
VALUES
  (-1, '0x', '0x', true, 0, 0, 0, 0, 0, 0, 0, 0, '2020-10-01 00:00:00'),
  (-1, 'deleted', 'deleted', true, 0, 0, 0, 0, 0, 0, 0, 0, '2020-10-01 00:00:00');