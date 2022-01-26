-- droping tables
DROP TABLE IF EXISTS test_table;
DROP TABLE IF EXISTS signer;
DROP TABLE IF EXISTS contract;
DROP INDEX IF EXISTS unique_signer;
DROP INDEX IF EXISTS unique_contract;

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
CREATE UNIQUE INDEX unique_contract ON test_table (contract_token, contract) WHERE signer IS NULL;
CREATE UNIQUE INDEX unique_signer ON test_table (contract_token, signer) WHERE contract IS NULL;

-- Populating with default valueses
INSERT INTO test_table
  (contract_token, signer, contract, balance)
VALUES
  ('token', 'signer', '0x', 0), -- This wont exist in our DB
  ('token', 'signer', NULL, 0),
  ('token', NULL, '0x', 0);

-- Working
-- Inserting conflict on token-signer ON conflict statement is not generic for token-contract
INSERT INTO test_table
  (contract_token, signer, contract, balance)
VALUES
  ('token', 'signer', NULL, 1)
ON CONFLICT (contract_token, signer) WHERE contract IS NULL DO UPDATE SET
  balance = EXCLUDED.balance;
  
-- Working
-- Inserting conflict on token-contract ON conflict statement is not generic for token-signer
INSERT INTO test_table
  (contract_token, signer, contract, balance)
VALUES
  ('token', NULL, '0x', 2)
ON CONFLICT (contract_token, contract) WHERE signer IS NULL DO UPDATE SET
  balance = EXCLUDED.balance;

-- Not working ???
-- INSERT INTO test_table
--   (contract_token, signer, contract, balance)
-- VALUES
--   ('token', NULL, '0x', 3),
--   ('token', 'signer', NULL, 4)
-- ON CONFLICT (contract_token, contract, signer) DO UPDATE SET -- ??????
--   balance = EXCLUDED.balance;
  
SELECT * FROM test_table;
--  ('token', 'signer', '0x', 0),
--  ('token', 'signer', NULL, 4),
--  ('token', NULL, '0x', 3);

