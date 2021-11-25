CREATE TABLE IF NOT EXISTS event (
  id BIGINT,
  block_id BIGINT,
  extrinsic_id BIGINT,
  index BIGINT NOT NULL,
  
  section TEXT NOT NULL,
  method TEXT NOT NULL,
  data JSON NOT NULL,

  timestamp timestamp default current_timestamp,

  PRIMARY KEY (id),
  CONSTRAINT fk_block
    FOREIGN KEY (block_id)
      REFERENCES block(id)
      ON DELETE CASCADE,
  CONSTRAINT fk_extrinsic
    FOREIGN KEY (extrinsic_id)
      REFERENCES extrinsic(id)
);