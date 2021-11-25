CREATE TABLE IF NOT EXISTS block (
  id BIGINT,
  
  hash TEXT NOT NULL,
  author TEXT NOT NULL,
  state_root TEXT NOT NULL,
  parent_hash TEXT NOT NULL,
  extrinsic_root TEXT NOT NULL,
  finalized BOOLEAN NOT NULL,

  timestamp timestamp default current_timestamp,

  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS block_hash_idx ON block (hash);
CREATE INDEX IF NOT EXISTS block_finalized_idx ON block (finalized);

INSERT INTO block
  (id, hash, author, state_root, parent_hash, extrinsic_root, finalized)
VALUES
  (-1, '', '', '', '', '', TRUE);