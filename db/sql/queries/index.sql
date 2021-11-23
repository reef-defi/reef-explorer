-- SELECT * FROM extrinsic;

-- INSERT INTO extrinsic
--     (block_id, index, hash, args, docs, method, section, signed, type)
--   VALUES
--     (1, 0, '0xcafeca39414f2df71b88f363604c730d9fe78e54d08daee52ec15d394d7576d7', '[1620874260004]', '["Set weight>"]', 'set', 'timestamp', '5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM', 'unsigned');


-- CREATE TABLE IF NOT EXISTS transfer (
--   id BIGSERIAL,
--   block_id BIGINT,
--   extrinsic_id BIGINT,

--   denom TEXT NOT NULL,
--   to_address VARCHAR NOT NULL,
--   from_address VARCHAR NOT NULL,
--   amount NUMERIC(80,0) NOT NULL,
--   fee_amount NUMERIC(80, 0) NOT NULL,

--   error_message TEXT,
--   success BOOLEAN NOT NULL,

--   timestamp timestamp default current_timestamp,

--   PRIMARY KEY (id),
--   CONSTRAINT fk_block
--     FOREIGN KEY(block_id)
--       REFERENCES block(id),
--   CONSTRAINT fk_extrinsic
--     FOREIGN KEY(extrinsic_id)
--       REFERENCES extrinsic(id)
-- );

  -- INSERT INTO transfer
  --   (block_id, extrinsic_id, denom, to_address, from_address, amount, fee_amount, success, error_message)
  -- VALUES
  --   (2240, 4, 'REEF', '5DvcwghWVZW9BueQ1RzHYcosrKUX6tbbMPhnYGv6XdjMmubF', '5EWQoe6as356KHLBsTYKKeTVVJ22PdfPrCCAQWP4wT9Wwjcc', 10000000000000000000000, 10000000000000000000000, 'true', '');

--   CREATE TABLE IF NOT EXISTS transfer (
--   id BIGSERIAL,
--   block_id BIGINT,
--   extrinsic_id BIGINT,

--   denom TEXT NOT NULL,
--   to_address VARCHAR NOT NULL,
--   from_address VARCHAR NOT NULL,
--   amount NUMERIC(80,0) NOT NULL,
--   fee_amount NUMERIC(80, 0) NOT NULL,

--   error_message TEXT,
--   success BOOLEAN NOT NULL,

--   timestamp timestamp default current_timestamp,

--   PRIMARY KEY (id),
--   CONSTRAINT fk_block
--     FOREIGN KEY(block_id)
--       REFERENCES block(id),
--   CONSTRAINT fk_extrinsic
--     FOREIGN KEY(extrinsic_id)
--       REFERENCES extrinsic(id)
-- );
-- SELECT * FROM block ORDER BY id DESC LIMIT 10;
SELECT * FROM unverified_evm_call;