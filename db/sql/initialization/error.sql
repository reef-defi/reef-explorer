CREATE TYPE IF NOT EXISTS ErrorType AS ENUM ('block', 'extrinsic', 'event');

CREATE TABLE IF NOT EXISTS error (
  id BIGSERIAL PRIMARY KEY,
  type ErrorType NOT NULL,
  message TEXT NOT NULL
)