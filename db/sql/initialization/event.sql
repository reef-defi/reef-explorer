CREATE TABLE IF NOT EXISTS event (
  id BIGSERIAL,
  block_id BIGINT,
  extrinsic_id BIGINT,
  index BIGINT,
  
  section TEXT, -- TODO
  method TEXT, -- TODO
  phase TEXT, -- TODO

  PRIMARY KEY (id),
  CONSTRAINT fk_block
    FOREIGN KEY (block_id)
      REFERENCES block(id),
  CONSTRAINT fk_extrinsic
    FOREIGN KEY (extrinsic_id)
      REFERENCES extrinsic(id)
);