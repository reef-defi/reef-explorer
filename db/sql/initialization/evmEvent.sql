CREATE TYPE EventStatus AS ENUM ('success', 'error');

CREATE TABLE IF NOT EXISTS unverified_evm_call (
  id BIGSERIAL,
  extrinsic_id BIGINT,
  signer VARCHAR,

  contract_address VARCHAR NOT NULL,
  data JSON NOT NULL,

  status EventStatus NOT NULL,
  error_message TEXT,

  gas_limit BIGINT NOT NULL,
  storage_limit BIGINT NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_extrinsic
    FOREIGN KEY (extrinsic_id)
      REFERENCES extrinsic(id)
      ON DELETE CASCADE,
  CONSTRAINT fk_signer
    FOREIGN KEY (signer)
      REFERENCES account(address)
      ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS unverified_evm_call_signer ON unverified_evm_call (signer);
CREATE INDEX IF NOT EXISTS unverified_evm_call_status ON unverified_evm_call (status);
CREATE INDEX IF NOT EXISTS unverified_evm_call_extrinsic_id ON unverified_evm_call (extrinsic_id);
CREATE INDEX IF NOT EXISTS unverified_evm_call_contract_address ON unverified_evm_call (contract_address);

CREATE TABLE IF NOT EXISTS verified_evm_call (
  id BIGSERIAL,
  signer VARCHAR,
  extrinsic_id BIGINT,
  contract_address VARCHAR,

  event_name TEXT,
  event_args JSON,

  status EventStatus,
  log JSON,

  gas_limit BIGINT,
  storage_limit BIGINT,
  fee BIGINT,

  PRIMARY KEY (id),
  CONSTRAINT fk_extrinsic
    FOREIGN KEY (extrinsic_id)
      REFERENCES extrinsic(id),
  CONSTRAINT fk_signer
    FOREIGN KEY (signer)
      REFERENCES account(address),
  CONSTRAINT fk_verified_contract
    FOREIGN KEY (contract_address)
      REFERENCES verified_contract(address)
);