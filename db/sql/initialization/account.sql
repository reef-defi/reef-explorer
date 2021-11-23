CREATE TABLE IF NOT EXISTS account (
  block_id BIGINT,
  address VARCHAR(48),
  evm_address VARCHAR(42), -- TODO maybe we can add also address as Primary Key

  active BOOLEAN NOT NULL,

  timestamp timestamp default current_timestamp,

  PRIMARY KEY (address)
);

-- Inserting chain account
INSERT INTO account 
  (block_id, evm_address, address, active)
VALUES
  (0, '0x', '0x', true),
  (0, 'deleted', 'deleted', true);