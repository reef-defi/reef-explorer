CREATE TYPE EventStatus AS ENUM ('success', 'error');

CREATE TABLE IF NOT EXISTS unverified_evm_event (
  extrinsic_id BIGINT,
  signer_address VARCHAR(48),
  contract_address VARCHAR(48),

  -- TODO add data for parsing

  CONSTRAINT fk_extrinsic
    FOREIGN KEY (extrinsic_id)
      REFERENCES extrinsic(id),
  CONSTRAINT fk_contract
    FOREIGN KEY (contract_address)
      REFERENCES contract(address),
  CONSTRAINT fk_account
    FOREIGN KEY (signer_address)
      REFERENCES account(evm_address)
);

CREATE TABLE IF NOT EXISTS verified_evm_event (
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

  CONSTRAINT fk_extrinsic
    FOREIGN KEY (extrinsic_id)
      REFERENCES extrinsic(id),
  CONSTRAINT fk_account
    FOREIGN KEY (signer_address)
      REFERENCES account(evm_address),
  CONSTRAINT fk_verified_contract
    FOREIGN KEY (verified_contract_id)
      REFERENCES verified_contract(id)
);