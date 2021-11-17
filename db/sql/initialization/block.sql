CREATE TABLE IF NOT EXISTS block (
  id BIGINT,
  
  -- TODO add block content

  finalized BOOLEAN NOT NULL,
  parent_hash TEXT NOT NULL,

  PRIMARY KEY (id)
);
