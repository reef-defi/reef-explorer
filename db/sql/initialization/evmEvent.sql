CREATE TABLE IF NOT EXISTS unverified-evm-event (
  extrinsic_id BIGINT,
  signer_address VARCHAR(48),
  contract_address VARCHAR(48),

  -- TODO add data for parsing

  CONSTRAINT fk_extrinsic
    FOREIGN KEY (extrinsic_id)
      REFERENCES extrinsic(id),
  CONSTRAINT fk_contract
    FOREIGN KEY (contract_address)
      REFERENCES contract(address)
  CONSTRAINT fk_signer
    FOREIGN KEY (signer_address)
      REFERENCES account(evm-address)
);

CREATE TABLE IF NOT EXISTS verified-evm-event (
  extrinsic_id BIGINT,
  contract_address VARCHAR(48),

)