CREATE TABLE IF NOT EXISTS block (
  id BIGINT,
  
  hash TEXT NOT NULL,
  author TEXT NOT NULL,
  state_root TEXT NOT NULL,
  parent_hash TEXT NOT NULL,
  extrinsic_root TEXT NOT NULL,
  finalized BOOLEAN NOT NULL,

  timestamp timestamp NOT NULL,
  crawler_timestamp timestamp default current_timestamp,

  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS block_hash_idx ON block (hash);
CREATE INDEX IF NOT EXISTS block_finalized_idx ON block (finalized);

INSERT INTO block
  (id, hash, author, state_root, parent_hash, extrinsic_root, finalized, timestamp)
VALUES
  (-1, '', '', '', '', '', TRUE, '2020-10-01 00:00:00');