CREATE TYPE EvmEventStatus AS ENUM ('Success', 'Error');
CREATE TYPE EvmEventType AS ENUM ('Verified', 'Unverified');

CREATE TABLE IF NOT EXISTS evm_event
(
    id               BIGSERIAL,
    event_id         BIGINT         NOT NULL,
    block_id         BIGINT         NOT NULL,
    event_index      BIGINT         NOT NULL,
    extrinsic_index  BIGINT         NOT NULL,

    contract_address VARCHAR        NOT NULL,
    data_raw         JSON           NOT NULL,
    data_parsed      JSON           NOT NULL,

    method           VARCHAR        NOT NULL,
    type             EvmEventType   NOT NULL,
    status           EvmEventStatus NOT NULL,

    topic_0          VARCHAR,
    topic_1          VARCHAR,
    topic_2          VARCHAR,
    topic_3          VARCHAR,

    PRIMARY KEY (id),
    CONSTRAINT fk_block
      FOREIGN KEY (block_id)
        REFERENCES block (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_event
      FOREIGN KEY (event_id)
        REFERENCES event (id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS evm_event_topic_0 ON evm_event (topic_0);
CREATE INDEX IF NOT EXISTS evm_event_topic_1 ON evm_event (topic_1);
CREATE INDEX IF NOT EXISTS evm_event_topic_2 ON evm_event (topic_2);
CREATE INDEX IF NOT EXISTS evm_event_topic_3 ON evm_event (topic_3);

CREATE INDEX IF NOT EXISTS evm_event_type ON evm_event (type);
CREATE INDEX IF NOT EXISTS evm_event_status ON evm_event (status);
CREATE INDEX IF NOT EXISTS evm_event_method ON evm_event (method);

CREATE INDEX IF NOT EXISTS evm_event_block_id ON evm_event (block_id);
CREATE INDEX IF NOT EXISTS evm_event_event_id ON evm_event (event_id);
CREATE INDEX IF NOT EXISTS evm_event_contract_address ON evm_event (contract_address);
