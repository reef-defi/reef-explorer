CREATE TYPE StakingType AS ENUM ('Reward', 'Slash');

CREATE TABLE IF NOT EXISTS staking (
  id BIGSERIAL,
  account VARCHAR,
  event_id BIGINT,

  type StakingType NOT NULL,
  amount NUMERIC(80,0) NOT NULL,

  timestamp timestamp default current_timestamp,

  PRIMARY KEY (id),
  CONSTRAINT fk_account
    FOREIGN KEY (account)
      REFERENCES account(address)
      ON DELETE CASCADE,
  CONSTRAINT fk_event
    FOREIGN KEY (event_id)
      REFERENCES event(id)
      ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS staking_type ON staking (type);
CREATE INDEX IF NOT EXISTS staking_account ON staking (account);
CREATE INDEX IF NOT EXISTS staking_event_id ON staking (event_id);