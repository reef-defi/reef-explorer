CREATE TYPE ExtrinsicType AS ENUM ('signed', 'unsigned', 'inherent');
CREATE TYPE ExtrinsicStatus AS ENUM ('success', 'error', 'unknown');

CREATE TABLE IF NOT EXISTS extrinsic (
  id BIGSERIAL,
  block_id BIGINT,

  index BIGINT NOT NULL,
  hash TEXT NOT NULL,
  args JSON NOT NULL,
  docs TEXT NOT NULL, 
  method TEXT NOT NULL,
  section TEXT NOT NULL,
  signed VARCHAR NOT NULL,

  status ExtrinsicStatus NOT NULL,
  error_message TEXT,

  type ExtrinsicType NOT NULL,
  signed_data JSON,
  inherent_data JSON,

  timestamp timestamp default current_timestamp,

  PRIMARY KEY (id),
  CONSTRAINT fk_block
    FOREIGN KEY(block_id)
      REFERENCES block(id)
);

INSERT INTO extrinsic
  (block_id, index, hash, args, docs, method, section, signed, status, type)
VALUES
  (-1, 0, '', '[]', '', '', '', '0x', 'success', 'unsigned');