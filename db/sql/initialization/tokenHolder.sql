CREATE TYPE TokenHolderType AS ENUM ('Account', 'Contract');

CREATE TABLE IF NOT EXISTS token_holder (
  token_address VARCHAR,

  signer VARCHAR,
  evm_address VARCHAR,
  type TokenHolderType NOT NULL,

  balance NUMERIC(80,0) NOT NULL,
  decimals INT NOT NULL,

  UNIQUE (signer, evm_address, token_address),
  CONSTRAINT fk_verified_contract
    FOREIGN KEY (token_address)
      REFERENCES contract(address)
      ON DELETE CASCADE,
  CONSTRAINT fk_signer
    FOREIGN KEY (signer)
      REFERENCES account(address)
      ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS token_holder_signer ON token_holder(signer);
CREATE INDEX IF NOT EXISTS token_holder_balance ON token_holder(balance);
CREATE INDEX IF NOT EXISTS token_holder_decimals ON token_holder(decimals);
CREATE INDEX IF NOT EXISTS token_holder_token_address ON token_holder(token_address);
CREATE INDEX IF NOT EXISTS token_holder_contract_address ON token_holder(contract_holder_address);