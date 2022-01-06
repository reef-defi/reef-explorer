CREATE TYPE ExtrinsicType AS ENUM ('signed', 'unsigned', 'inherent');
CREATE TYPE ExtrinsicStatus AS ENUM ('success', 'error', 'unknown');

CREATE TABLE IF NOT EXISTS extrinsic (
  id BIGINT,
  block_id BIGINT,

  index BIGINT NOT NULL,
  hash TEXT NOT NULL,
  args JSON NOT NULL,
  docs TEXT NOT NULL, 
  method TEXT NOT NULL,
  section TEXT NOT NULL,
  signer VARCHAR NOT NULL,

  status ExtrinsicStatus NOT NULL,
  error_message TEXT,

  type ExtrinsicType NOT NULL,
  signed_data JSON,
  inherent_data JSON,

  timestamp timestamptz NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_block
    FOREIGN KEY(block_id)
      REFERENCES block(id)
      ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS extrinsic_hash ON extrinsic (hash);
CREATE INDEX IF NOT EXISTS extrinsic_method ON extrinsic (method);
CREATE INDEX IF NOT EXISTS extrinsic_signer ON extrinsic (signer);
CREATE INDEX IF NOT EXISTS extrinsic_section ON extrinsic (section);
CREATE INDEX IF NOT EXISTS extrinsic_block_id ON extrinsic (block_id);

INSERT INTO extrinsic
  (id, block_id, index, hash, args, docs, method, section, signer, status, type, timestamp)
VALUES
  (-1, -1, 0, '', '[]', '', '', '', '0x', 'success', 'unsigned', '2020-10-01 00:00:00');