CREATE TYPE StakingType AS ENUM ('Reward', 'Slash');

CREATE TABLE IF NOT EXISTS staking (
  id BIGSERIAL,
  signer VARCHAR,
  event_id BIGINT,

  type StakingType NOT NULL,
  amount NUMERIC(80,0) NOT NULL,

  timestamp timestamptz NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_signer
    FOREIGN KEY (signer)
      REFERENCES account(address)
      ON DELETE CASCADE,
  CONSTRAINT fk_event
    FOREIGN KEY (event_id)
      REFERENCES event(id)
      ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS staking_type ON staking (type);
CREATE INDEX IF NOT EXISTS staking_signer ON staking (signer);
CREATE INDEX IF NOT EXISTS staking_event_id ON staking (event_id);