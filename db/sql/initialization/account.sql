CREATE TABLE IF NOT EXISTS account (
  block_id BIGINT,
  evm_address VARCHAR(42),
  address VARCHAR(48), -- TODO maybe we can add also address as Primary Key
  -- TODO add additional attributes

  PRIMARY KEY (address)
);

-- Inserting chain account
INSERT INTO account 
  (block_id, evm_address, address)
VALUES
  (0, '0x', '0x'),
  (0, 'deleted', 'deleted');