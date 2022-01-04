CREATE TYPE TokenHolderType AS ENUM ('Account', 'Contract');

CREATE TABLE IF NOT EXISTS token_holder (
  token_address VARCHAR,

  signer VARCHAR,
  contract_holder_address VARCHAR,
  type TokenHolderType NOT NULL,

  balance NUMERIC(80,0) NOT NULL,
  decimals INT NOT NULL,

  UNIQUE (signer, token_address),
  CONSTRAINT fk_verified_contract
    FOREIGN KEY (token_address)
      REFERENCES contract(address)
      ON DELETE NO ACTION,
  CONSTRAINT fk_signer
    FOREIGN KEY (signer)
      REFERENCES account(address)
      ON DELETE NO ACTION,
  CONSTRAINT fk_contract_address
    FOREIGN KEY (contract_holder_address)
      REFERENCES contract(address)
      ON DELETE NO ACTION
);

CREATE INDEX IF NOT EXISTS token_holder_balance_balance ON token_holder_balance(balance);
CREATE INDEX IF NOT EXISTS token_holder_balance_decimals ON token_holder_balance(decimals);
CREATE INDEX IF NOT EXISTS token_holder_balance_token_address ON token_holder_balance(token_address);
CREATE INDEX IF NOT EXISTS token_holder_balance_account_address ON token_holder_balance(signer);
