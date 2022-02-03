CREATE TYPE TokenHolderType AS ENUM ('Account', 'Contract');

CREATE TABLE IF NOT EXISTS token_holder (
  token_address VARCHAR NOT NULL,

  signer VARCHAR,
  evm_address VARCHAR,
  nft_id NUMERIC(80, 0),
  type TokenHolderType NOT NULL,

  balance NUMERIC(80,0) NOT NULL,

  -- decimals INT NOT NULL,
  info JSONB NOT NULL,

  timestamp timestamptz NOT NULL,

  CONSTRAINT fk_verified_contract
    FOREIGN KEY (token_address)
      REFERENCES contract(address)
      ON DELETE CASCADE,
  CONSTRAINT fk_signer
    FOREIGN KEY (signer)
      REFERENCES account(address)
      ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_account_token_holder ON token_holder (token_address, signer) WHERE evm_address IS NULL AND nft_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_contract_token_holder ON token_holder (token_address, evm_address) WHERE signer IS NULL AND nft_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_account_nft_holder ON token_holder (token_address, signer, nft_id) WHERE evm_address IS NULL AND nft_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_contract_nft_holder ON token_holder (token_address, evm_address, nft_id) WHERE signer IS NULL AND nft_id IS NOT NULL;

-- CREATE INDEX IF NOT EXISTS token_holder_info ON token_holder(info);
CREATE INDEX IF NOT EXISTS token_holder_signer ON token_holder(signer);
CREATE INDEX IF NOT EXISTS token_holder_balance ON token_holder(balance);
CREATE INDEX IF NOT EXISTS token_holder_evm_address ON token_holder(evm_address);
CREATE INDEX IF NOT EXISTS token_holder_token_address ON token_holder(token_address);
