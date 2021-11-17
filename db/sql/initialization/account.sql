CREATE TABLE IF NOT EXISTS account (
  evm_address VARCHAR(42) PRIMARY KEY,
  address VARCHAR(48) NOT NULL -- TODO maybe we can add also address as Primary Key
  -- TODO add additional attributes
);

-- Inserting default account
INSERT INTO account (evm_address, address)
VALUES
  ('0x', '0x');