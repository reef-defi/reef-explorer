CREATE TABLE IF NOT EXISTS transfer (
  id BIGSERIAL,
  block_id BIGINT,
  extrinsic_id BIGINT,
  to_address VARCHAR,
  from_address VARCHAR NOT NULL,

  denom TEXT NOT NULL,
  amount NUMERIC(80,0) NOT NULL,
  fee_amount NUMERIC(80, 0) NOT NULL,

  error_message TEXT,
  success BOOLEAN NOT NULL,

  timestamp timestamp default current_timestamp,

  PRIMARY KEY (id),
  CONSTRAINT fk_block
    FOREIGN KEY(block_id)
      REFERENCES block(id),
  CONSTRAINT fk_extrinsic
    FOREIGN KEY(extrinsic_id)
      REFERENCES extrinsic(id),
  CONSTRAINT fk_from_address
    FOREIGN KEY(from_address)
      REFERENCES account(address)
);