CREATE TYPE EventStatus AS ENUM ('success', 'error');

CREATE TABLE IF NOT EXISTS evm_event
(
    id               BIGSERIAL,
    event_id         BIGINT,

    contract_address VARCHAR     NOT NULL,
    data_raw         JSON        NOT NULL,
    data_parsed      JSON        NOT NULL,

    method           VARCHAR     NOT NULL,
    topic_0          VARCHAR,
    topic_1          VARCHAR,
    topic_2          VARCHAR,
    topic_3          VARCHAR,
    block_id         BIGINT     NOT NULL,
    extrinsic_index  BIGINT     NOT NULL,
    event_index      BIGINT     NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_event
        FOREIGN KEY (event_id)
            REFERENCES event (id)
            ON DELETE CASCADE,
    CONSTRAINT fk_contract
        FOREIGN KEY (contract_address)
            REFERENCES contract (address)
            ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS evm_event_method ON evm_event (method);
CREATE INDEX IF NOT EXISTS evm_event_event_id ON evm_event (event_id);
CREATE INDEX IF NOT EXISTS evm_event_contract_address ON evm_event (contract_address);
CREATE INDEX IF NOT EXISTS evm_event_topic_0 ON evm_event (topic_0);
CREATE INDEX IF NOT EXISTS evm_event_topic_1 ON evm_event (topic_1);
CREATE INDEX IF NOT EXISTS evm_event_topic_2 ON evm_event (topic_2);
CREATE INDEX IF NOT EXISTS evm_event_topic_3 ON evm_event (topic_3);
CREATE INDEX IF NOT EXISTS evm_event_block_id ON evm_event (block_id);
CREATE INDEX IF NOT EXISTS evm_event_extrinsic_index ON evm_event (extrinsic_index);
CREATE INDEX IF NOT EXISTS evm_event_event_index ON evm_event (event_index);
