-- droping tables
DROP TABLE IF EXISTS test_table;
DROP TABLE IF EXISTS signer;
DROP TABLE IF EXISTS contract;
DROP INDEX IF EXISTS unique_nft_signer;
DROP INDEX IF EXISTS unique_nft_contract;
DROP INDEX IF EXISTS unique_token_signer;
DROP INDEX IF EXISTS unique_token_contract;

-- Recreating example tables
CREATE TABLE signer (
  name VARCHAR NOT NULL PRIMARY KEY
);

CREATE TABLE contract (
  name VARCHAR NOT NULL PRIMARY KEY
);

INSERT INTO signer 
	(name)
VALUES
	('signer');
    
INSERT INTO contract
	(name)
VALUES
	('token');
    
-- our token holder table
CREATE TABLE test_table (
  signer VARCHAR,
  contract VARCHAR,
  nft_id INT,
  contract_token VARCHAR NOT NULL,
  balance INT,
  
  CONSTRAINT fk_contract
  	FOREIGN KEY (contract_token)
  	  REFERENCES contract(name),
  CONSTRAINT fk_signer
  	FOREIGN KEY (signer)
  	  REFERENCES signer(name)
);

-- creating unique indexes to ensure having same always unique token-signer or token-contract
CREATE UNIQUE INDEX unique_nft_signer ON test_table (contract_token, signer, nft_id) WHERE contract IS NULL AND nft_id IS NOT NULL;
CREATE UNIQUE INDEX unique_nft_contract ON test_table (contract_token, contract, nft_id) WHERE signer IS NULL AND nft_id IS NOT NULL;
CREATE UNIQUE INDEX unique_token_signer ON test_table (contract_token, signer) WHERE contract IS NULL AND nft_id IS NULL;
CREATE UNIQUE INDEX unique_token_contract ON test_table (contract_token, contract) WHERE signer IS NULL AND nft_id IS NULL;

-- Populating with default valueses
INSERT INTO test_table
  (contract_token, signer, contract, nft_id, balance)
VALUES
  ('token', 'signer', NULL, NULL, 0),
  ('token',     NULL, '0x', NULL, 0),
  ('token', 'signer', NULL,    1, 0),
  ('token',     NULL, '0x',    2, 0);

-- Inserting token signer balances
INSERT INTO test_table
  (contract_token, signer, contract, nft_id, balance)
VALUES
  ('token', 'signer', NULL, NULL, 1)
ON CONFLICT (contract_token, signer) WHERE contract IS NULL AND nft_id IS NULL DO UPDATE SET
  balance = EXCLUDED.balance;
  
-- Inserting token contract balances
INSERT INTO test_table
  (contract_token, signer, contract, nft_id, balance)
VALUES
  ('token', NULL, '0x', NULL, 2)
ON CONFLICT (contract_token, contract) WHERE signer IS NULL AND nft_id IS NULL DO UPDATE SET
  balance = EXCLUDED.balance;

-- Inserting nft signer balances
INSERT INTO test_table
  (contract_token, signer, contract, nft_id, balance)
VALUES
  ('token', 'signer', NULL, 1, 3)
ON CONFLICT (contract_token, signer, nft_id) WHERE contract IS NULL AND nft_id IS NOT NULL DO UPDATE SET
  balance = EXCLUDED.balance;
  
-- Inserting nft contract balances
INSERT INTO test_table
  (contract_token, signer, contract, nft_id, balance)
VALUES
  ('token', NULL, '0x', 2, 4)
ON CONFLICT (contract_token, contract, nft_id) WHERE signer IS NULL AND nft_id IS NOT NULL DO UPDATE SET
  balance = EXCLUDED.balance;

-- Viewing results
SELECT * FROM test_table;

-- Expacted results
-- (signer, NULL, NULL, token, 1)
-- (  NULL,   0x, NULL, token, 2)
-- (signer, NULL,    1, token, 3)
-- (  NULL,   0x,    2, token, 4)

