CREATE TYPE ExtrinsicType AS ENUM ('signed', 'unsigned', 'inherent');

CREATE TABLE IF NOT EXISTS extrinsic (
  id BIGSERIAL,
  block_id BIGINT,
  index BIGINT,

  hash TEXT, -- TODO 
  status TEXT, -- TODO
  arguments TEXT, -- TODO
  docs TEXT, -- TODO

  type ExtrinsicType,
  signed_data JSON,
  inherent_data JSON,

  PRIMARY KEY (id),
  CONSTRAINT fk_block
    FOREIGN KEY(block_id)
      REFERENCES block(id)
);