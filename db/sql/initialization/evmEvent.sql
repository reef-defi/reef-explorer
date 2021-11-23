CREATE TYPE EventStatus AS ENUM ('success', 'error');

CREATE TABLE IF NOT EXISTS unverified_evm_call (
  id BIGSERIAL,
  extrinsic_id BIGINT,
  signer_address VARCHAR(48),

  contract_address VARCHAR NOT NULL,
  data JSON NOT NULL,

  status EventStatus NOT NULL,
  error_message TEXT,

  gas_limit BIGINT NOT NULL,
  storage_limit BIGINT NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_extrinsic
    FOREIGN KEY (extrinsic_id)
      REFERENCES extrinsic(id),
  CONSTRAINT fk_account
    FOREIGN KEY (signer_address)
      REFERENCES account(address)
);

CREATE TABLE IF NOT EXISTS verified_evm_call (
  id BIGSERIAL,
  extrinsic_id BIGINT,
  signer_address VARCHAR(48),
  verified_contract_id BIGINT,

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
  CONSTRAINT fk_account
    FOREIGN KEY (signer_address)
      REFERENCES account(address),
  CONSTRAINT fk_verified_contract
    FOREIGN KEY (verified_contract_id)
      REFERENCES verified_contract(id)
);