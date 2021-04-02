GRANT ALL PRIVILEGES ON DATABASE reef TO reef;

CREATE TABLE IF NOT EXISTS block (  
  block_number BIGINT NOT NULL,
  finalized BOOLEAN NOT NULL,
  block_author TEXT NOT NULL,
  block_author_name TEXT NOT NULL,
  block_hash TEXT NOT NULL,
  parent_hash TEXT NOT NULL,
  extrinsics_root TEXT NOT NULL,
  state_root TEXT NOT NULL,
  total_events INT NOT NULL,
  total_extrinsics INT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number )  
);

CREATE TABLE IF NOT EXISTS harvester_error (  
  block_number BIGINT NOT NULL,
  error TEXT NOT NULL,
  timestamp BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS event (  
  block_number BIGINT NOT NULL,
  event_index INT NOT NULL,
  section TEXT NOT NULL,
  method TEXT NOT NULL,
  phase TEXT NOT NULL,
  data TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, event_index ) 
);

CREATE TABLE IF NOT EXISTS extrinsic (  
  block_number BIGINT NOT NULL,
  extrinsic_index INT NOT NULL,
  is_signed BOOLEAN NOT NULL,
  signer TEXT,
  section TEXT NOT NULL,
  method TEXT NOT NULL,
  args TEXT NOT NULL,
  hash TEXT NOT NULL,
  doc TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, extrinsic_index ) 
);

CREATE TABLE IF NOT EXISTS account  (  
  account_id TEXT NOT NULL,
  identity TEXT NOT NULL,
  identity_display TEXT NOT NULL,
  identity_display_parent TEXT NOT NULL,
  balances TEXT NOT NULL,
  available_balance TEXT NOT NULL,
  free_balance TEXT NOT NULL,
  locked_balance TEXT NOT NULL,
  nonce BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  block_height BIGINT NOT NULL,
  PRIMARY KEY ( account_id )  
);

CREATE TABLE IF NOT EXISTS contract  (  
  contract_id TEXT NOT NULL, -- evm.Created 0x29c08687a237fdc32d115f6b6c885428d170a2d8
  init TEXT NOT NULL, -- https://reefscan.com/block/?blockNumber=118307
  value TEXT NOT NULL,
  gas_limit TEXT NOT NULL,
  storage_limit TEXT NOT NULL,
  PRIMARY KEY ( contract_id )  
);

CREATE TABLE IF NOT EXISTS total (  
  name TEXT,
  count BIGINT NOT NULL,
  PRIMARY KEY ( name )
);

INSERT INTO total (name, count) VALUES ('blocks', 0),('extrinsics', 0),('transfers', 0),('events', 0),('contracts', 0);

CREATE INDEX IF NOT EXISTS extrinsic_section_idx ON extrinsic (section);
CREATE INDEX IF NOT EXISTS extrinsic_method_idx ON extrinsic (method);
CREATE INDEX IF NOT EXISTS extrinsic_signer_idx ON extrinsic (signer);

GRANT ALL PRIVILEGES ON TABLE block TO reef;
GRANT ALL PRIVILEGES ON TABLE harvester_error TO reef;
GRANT ALL PRIVILEGES ON TABLE event TO reef;
GRANT ALL PRIVILEGES ON TABLE extrinsic TO reef;
GRANT ALL PRIVILEGES ON TABLE account TO reef;
GRANT ALL PRIVILEGES ON TABLE contract TO reef;
GRANT ALL PRIVILEGES ON TABLE total TO reef;
