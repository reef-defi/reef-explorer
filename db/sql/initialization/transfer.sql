CREATE TYPE TransferType AS ENUM ('Native', 'ERC20', 'ERC721', 'ERC1155');

CREATE TABLE IF NOT EXISTS transfer (
  id BIGSERIAL,
  block_id BIGINT,
  extrinsic_id BIGINT,

  to_address VARCHAR,
  from_address VARCHAR,
  token_address VARCHAR,
  to_evm_address VARCHAR,
  from_evm_address VARCHAR,

  type TransferType NOT NULL,
  amount NUMERIC(80,0) NOT NULL,
  fee_amount NUMERIC(80, 0) NOT NULL,

  -- ERC20 info - should we move this out?
  denom TEXT,
  -- ERC721 and ERC1155 ids
  nft_id NUMERIC(80, 0),

  error_message TEXT,
  success BOOLEAN NOT NULL,

  timestamp timestamptz NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_block
    FOREIGN KEY(block_id)
      REFERENCES block(id)
      ON DELETE CASCADE,
  CONSTRAINT fk_extrinsic
    FOREIGN KEY(extrinsic_id)
      REFERENCES extrinsic(id)
      ON DELETE CASCADE,
  CONSTRAINT fk_from_address
    FOREIGN KEY(from_address)
      REFERENCES account(address)
      ON DELETE CASCADE,
  CONSTRAINT fk_to_address
    FOREIGN KEY(to_address)
      REFERENCES account(address)
      ON DELETE CASCADE,
  CONSTRAINT fk_token_address
    FOREIGN KEY(token_address)
      REFERENCES contract(address)
      ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS transfer_denom ON transfer (denom);
CREATE INDEX IF NOT EXISTS transfer_success ON transfer (success);

CREATE INDEX IF NOT EXISTS transfer_block_id ON transfer (block_id);
CREATE INDEX IF NOT EXISTS transfer_extrinsic_id ON transfer (extrinsic_id);

CREATE INDEX IF NOT EXISTS transfer_type ON transfer (type);
CREATE INDEX IF NOT EXISTS transfer_denom ON transfer (denom);
CREATE INDEX IF NOT EXISTS transfer_amount ON transfer (amount);
CREATE INDEX IF NOT EXISTS transfer_nft_id ON transfer (nft_id);
CREATE INDEX IF NOT EXISTS transfer_fee_amount ON transfer (fee_amount);

CREATE INDEX IF NOT EXISTS transfer_to_address ON transfer (to_address);
CREATE INDEX IF NOT EXISTS transfer_from_address ON transfer (from_address);
CREATE INDEX IF NOT EXISTS transfer_token_address ON transfer (token_address);
CREATE INDEX IF NOT EXISTS transfer_to_evm_address ON transfer (to_evm_address);
CREATE INDEX IF NOT EXISTS transfer_from_evm_address ON transfer (from_evm_address);