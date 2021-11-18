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
