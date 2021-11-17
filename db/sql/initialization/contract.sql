CREATE TYPE ContractType AS ENUM ('ERC20', 'ERC721', 'other');

CREATE TABLE IF NOT EXISTS contract (
  address VARCHAR(48),
  extrinsic_id BIGINT,
  bytecode TEXT,
  bytecode_context TEXT,
  argument_bytecode TEXT,

  PRIMARY KEY (address),
  CONSTRAINT fk_extrinsic
    FOREIGN KEY (extrinsic_id)
      REFERENCES extrinsic(id)
);

CREATE TABLE IF NOT EXISTS verified_contract (
  id BIGSERIAL,
  address VARCHAR(48),
  
  name TEXT,
  filename TEXT,
  source JSON,
  runs INT,
  optimization BOOLEAN,
  compiler_version TEXT, -- TODO maybe change to custom enum type?
  compiled_data JSON,
  arguments JSON,

  type ContractType DEFAULT 'other',
  contract_data JSON,

  PRIMARY KEY (id),
  CONSTRAINT fk_contract
    FOREIGN KEY (address)
      REFERENCES contract(address)
);

CREATE TABLE IF NOT EXISTS newly_verified_contract_queue (
  id BIGINT,
  CONSTRAINT fk_verified_contract
    FOREIGN KEY (id)
      REFERENCES verified_contract(id)
);

CREATE TABLE IF NOT EXISTS verification_request (
  address VARCHAR(48),
  block_id BIGINT,

  name TEXT,
  filename TEXT,
  source JSON,
  runs INT,
  optimization BOOLEAN,
  compiler_version TEXT, -- TODO maybe change to custom enum type?
  compiled_data JSON,
  arguments JSON,

  status BOOLEAN,
  message TEXT,

  CONSTRAINT fk_contract
    FOREIGN KEY (address)
      REFERENCES contract(address)
);

