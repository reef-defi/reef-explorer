CREATE TYPE EventStatus AS ENUM ('success', 'error');


CREATE TABLE IF NOT EXISTS evm_event
(
    id               BIGSERIAL,
    event_id         BIGINT,

    contract_address VARCHAR     NOT NULL,
    data_raw         JSON        NOT NULL,
    data_parsed      JSON        NOT NULL,

    success          BOOLEAN     NOT NULL,
    topic_0          VARCHAR,
    topic_1          VARCHAR,
    topic_2          VARCHAR,
    topic_3          VARCHAR,
    timestamp        timestamptz NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_event
        FOREIGN KEY (event_id)
            REFERENCES event (id)
            ON DELETE CASCADE,
    CONSTRAINT fk_signer
        FOREIGN KEY (signer)
            REFERENCES account (address)
            ON DELETE CASCADE,
    CONSTRAINT fk_contract
        FOREIGN KEY (contract_address)
            REFERENCES contract (address)
            ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS evm_event_status ON evm_event (success);
CREATE INDEX IF NOT EXISTS evm_event_event_id ON evm_event (event_id);
CREATE INDEX IF NOT EXISTS evm_event_contract_address ON evm_event (contract_address);
CREATE INDEX IF NOT EXISTS evm_event_topic_0 ON evm_event (topic_0);
CREATE INDEX IF NOT EXISTS evm_event_topic_1 ON evm_event (topic_1);
CREATE INDEX IF NOT EXISTS evm_event_topic_2 ON evm_event (topic_2);
CREATE INDEX IF NOT EXISTS evm_event_topic_3 ON evm_event (topic_3);


CREATE TABLE IF NOT EXISTS unverified_evm_call
(
    id               BIGSERIAL,
    extrinsic_id     BIGINT,
    signer           VARCHAR,

    contract_address VARCHAR     NOT NULL,
    data             JSON        NOT NULL,

    status           EventStatus NOT NULL,
    error_message    TEXT,

    gas_limit        BIGINT      NOT NULL,
    storage_limit    BIGINT      NOT NULL,
    timestamp        timestamptz NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_extrinsic
        FOREIGN KEY (extrinsic_id)
            REFERENCES extrinsic (id)
            ON DELETE CASCADE,
    CONSTRAINT fk_signer
        FOREIGN KEY (signer)
            REFERENCES account (address)
            ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS unverified_evm_call_signer ON unverified_evm_call (signer);
CREATE INDEX IF NOT EXISTS unverified_evm_call_status ON unverified_evm_call (status);
CREATE INDEX IF NOT EXISTS unverified_evm_call_extrinsic_id ON unverified_evm_call (extrinsic_id);
CREATE INDEX IF NOT EXISTS unverified_evm_call_contract_address ON unverified_evm_call (contract_address);

CREATE TABLE IF NOT EXISTS verified_evm_call
(
    id               BIGSERIAL,
    signer           VARCHAR,
    extrinsic_id     BIGINT,
    contract_address VARCHAR,

    event_name       TEXT,
    event_args       JSON,

    status           EventStatus,
    log              JSON,

    gas_limit        BIGINT,
    storage_limit    BIGINT,
    fee              BIGINT,
    timestamp        timestamptz NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_extrinsic
        FOREIGN KEY (extrinsic_id)
            REFERENCES extrinsic (id),
    CONSTRAINT fk_signer
        FOREIGN KEY (signer)
            REFERENCES account (address),
    CONSTRAINT fk_verified_contract
        FOREIGN KEY (contract_address)
            REFERENCES verified_contract (address)
);
