SET check_function_bodies = false;
CREATE TYPE public.contracttype AS ENUM (
    'ERC20',
    'ERC721',
    'ERC1155',
    'other'
);
CREATE TYPE public.evmeventstatus AS ENUM (
    'Success',
    'Error'
);
CREATE TYPE public.evmeventtype AS ENUM (
    'Verified',
    'Unverified'
);
CREATE TYPE public.extrinsicstatus AS ENUM (
    'success',
    'error',
    'unknown'
);
CREATE TYPE public.extrinsictype AS ENUM (
    'signed',
    'unsigned',
    'inherent'
);
CREATE TYPE public.stakingtype AS ENUM (
    'Reward',
    'Slash'
);
CREATE TYPE public.tokenholdertype AS ENUM (
    'Account',
    'Contract'
);
CREATE TYPE public.transfertype AS ENUM (
    'Native',
    'ERC20',
    'ERC721',
    'ERC1155'
);
CREATE FUNCTION public.account_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chain_info SET count = count + 1 WHERE name = 'accounts';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE chain_info SET count = count - 1 WHERE name = 'accounts';
    RETURN OLD;
  ELSE
    UPDATE chain_info SET count = 0 WHERE name = 'accounts';
    RETURN NULL;
  END IF;
END;$$;
CREATE FUNCTION public.block_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chain_info SET count = count + 1 WHERE name = 'blocks';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE chain_info SET count = count - 1 WHERE name = 'blocks';
    RETURN OLD;
  ELSE
    UPDATE chain_info SET count = 0 WHERE name = 'blocks';
    RETURN NULL;
  END IF;
END;$$;
CREATE FUNCTION public.contract_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chain_info SET count = count + 1 WHERE name = 'contracts';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE chain_info SET count = count - 1 WHERE name = 'contracts';
    RETURN OLD;
  ELSE
    UPDATE chain_info SET count = 0 WHERE name = 'contracts';
    RETURN NULL;
  END IF;
END;$$;
CREATE FUNCTION public.event_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chain_info SET count = count + 1 WHERE name = 'events';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE chain_info SET count = count - 1 WHERE name = 'events';
    RETURN OLD;
  ELSE
    UPDATE chain_info SET count = 0 WHERE name = 'events';
    RETURN NULL;
  END IF;
END;$$;
CREATE FUNCTION public.extrinsic_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chain_info SET count = count + 1 WHERE name = 'extrinsics';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE chain_info SET count = count - 1 WHERE name = 'extrinsics';
    RETURN OLD;
  ELSE
    UPDATE chain_info SET count = 0 WHERE name = 'extrinsics';
    RETURN NULL;
  END IF;
END;$$;
CREATE FUNCTION public.new_verified_contract_found() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
	INSERT INTO newly_verified_contract_queue (address) VALUES (NEW.address);
  RETURN NEW;
END;
$$;
CREATE FUNCTION public.transfer_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chain_info SET count = count + 1 WHERE name = 'transfers';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE chain_info SET count = count - 1 WHERE name = 'transfers';
    RETURN OLD;
  ELSE
    UPDATE chain_info SET count = 0 WHERE name = 'transfers';
    RETURN NULL;
  END IF;
END;$$;
CREATE TABLE public.account (
    block_id bigint,
    address character varying(48) NOT NULL,
    evm_address character varying(42),
    identity json,
    active boolean NOT NULL,
    free_balance numeric(80,0) NOT NULL,
    locked_balance numeric(80,0) NOT NULL,
    available_balance numeric(80,0) NOT NULL,
    reserved_balance numeric(80,0) NOT NULL,
    vested_balance numeric(80,0) NOT NULL,
    voting_balance numeric(80,0) NOT NULL,
    nonce bigint NOT NULL,
    evm_nonce bigint NOT NULL,
    "timestamp" timestamp with time zone NOT NULL
);
CREATE TABLE public.block (
    id bigint NOT NULL,
    hash text NOT NULL,
    author text NOT NULL,
    state_root text NOT NULL,
    parent_hash text NOT NULL,
    extrinsic_root text NOT NULL,
    finalized boolean NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    crawler_timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE public.chain_info (
    name text NOT NULL,
    count numeric(80,0) NOT NULL
);
CREATE TABLE public.contract (
    address character varying(48) NOT NULL,
    extrinsic_id bigint,
    signer character varying NOT NULL,
    bytecode text NOT NULL,
    bytecode_context text NOT NULL,
    bytecode_arguments text NOT NULL,
    gas_limit bigint NOT NULL,
    storage_limit bigint NOT NULL,
    "timestamp" timestamp with time zone NOT NULL
);
CREATE TABLE public.event (
    id bigint NOT NULL,
    block_id bigint,
    extrinsic_id bigint,
    index bigint NOT NULL,
    phase json NOT NULL,
    section text NOT NULL,
    method text NOT NULL,
    data json NOT NULL,
    "timestamp" timestamp with time zone NOT NULL
);
CREATE TABLE public.evm_event (
    id bigint NOT NULL,
    event_id bigint NOT NULL,
    block_id bigint NOT NULL,
    event_index bigint NOT NULL,
    extrinsic_index bigint NOT NULL,
    contract_address character varying NOT NULL,
    data_raw json NOT NULL,
    data_parsed json NOT NULL,
    method character varying NOT NULL,
    type public.evmeventtype NOT NULL,
    status public.evmeventstatus NOT NULL,
    topic_0 character varying,
    topic_1 character varying,
    topic_2 character varying,
    topic_3 character varying
);
CREATE SEQUENCE public.evm_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.evm_event_id_seq OWNED BY public.evm_event.id;
CREATE TABLE public.extrinsic (
    id bigint NOT NULL,
    block_id bigint,
    index bigint NOT NULL,
    hash text NOT NULL,
    args json NOT NULL,
    docs text NOT NULL,
    method text NOT NULL,
    section text NOT NULL,
    signer character varying NOT NULL,
    status public.extrinsicstatus NOT NULL,
    error_message text,
    type public.extrinsictype NOT NULL,
    signed_data json,
    inherent_data json,
    "timestamp" timestamp with time zone NOT NULL
);
CREATE TABLE public.newly_verified_contract_queue (
    address character varying(48)
);
CREATE TABLE public.staking (
    id bigint NOT NULL,
    signer character varying,
    event_id bigint,
    type public.stakingtype NOT NULL,
    amount numeric(80,0) NOT NULL,
    "timestamp" timestamp with time zone NOT NULL
);
CREATE SEQUENCE public.staking_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.staking_id_seq OWNED BY public.staking.id;
CREATE TABLE public.token_holder (
    token_address character varying NOT NULL,
    signer character varying,
    evm_address character varying,
    nft_id numeric(80,0),
    type public.tokenholdertype NOT NULL,
    balance numeric(80,0) NOT NULL,
    info jsonb NOT NULL,
    "timestamp" timestamp with time zone NOT NULL
);
CREATE TABLE public.transfer (
    id bigint NOT NULL,
    block_id bigint,
    extrinsic_id bigint,
    to_address character varying,
    from_address character varying,
    token_address character varying,
    to_evm_address character varying,
    from_evm_address character varying,
    type public.transfertype NOT NULL,
    amount numeric(80,0) NOT NULL,
    fee_amount numeric(80,0) NOT NULL,
    denom text,
    nft_id numeric(80,0),
    error_message text,
    success boolean NOT NULL,
    "timestamp" timestamp with time zone NOT NULL
);
CREATE SEQUENCE public.transfer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.transfer_id_seq OWNED BY public.transfer.id;
CREATE TABLE public.verification_request (
    id bigint NOT NULL,
    address character varying(48),
    name text NOT NULL,
    filename text NOT NULL,
    source json NOT NULL,
    runs integer NOT NULL,
    optimization boolean NOT NULL,
    compiler_version text NOT NULL,
    args json NOT NULL,
    target text NOT NULL,
    success boolean NOT NULL,
    message text,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE SEQUENCE public.verification_request_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.verification_request_id_seq OWNED BY public.verification_request.id;
CREATE TABLE public.verified_contract (
    address character varying(48),
    name text NOT NULL,
    filename text NOT NULL,
    source json NOT NULL,
    optimization boolean NOT NULL,
    compiler_version text NOT NULL,
    compiled_data json NOT NULL,
    args json NOT NULL,
    runs integer NOT NULL,
    target text NOT NULL,
    type public.contracttype DEFAULT 'other'::public.contracttype,
    contract_data json,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE ONLY public.evm_event ALTER COLUMN id SET DEFAULT nextval('public.evm_event_id_seq'::regclass);
ALTER TABLE ONLY public.staking ALTER COLUMN id SET DEFAULT nextval('public.staking_id_seq'::regclass);
ALTER TABLE ONLY public.transfer ALTER COLUMN id SET DEFAULT nextval('public.transfer_id_seq'::regclass);
ALTER TABLE ONLY public.verification_request ALTER COLUMN id SET DEFAULT nextval('public.verification_request_id_seq'::regclass);
ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (address);
ALTER TABLE ONLY public.block
    ADD CONSTRAINT block_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chain_info
    ADD CONSTRAINT chain_info_pkey PRIMARY KEY (name);
ALTER TABLE ONLY public.contract
    ADD CONSTRAINT contract_pkey PRIMARY KEY (address);
ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.evm_event
    ADD CONSTRAINT evm_event_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.extrinsic
    ADD CONSTRAINT extrinsic_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.staking
    ADD CONSTRAINT staking_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.transfer
    ADD CONSTRAINT transfer_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.verification_request
    ADD CONSTRAINT verification_request_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.verified_contract
    ADD CONSTRAINT verified_contract_address_key UNIQUE (address);
CREATE INDEX account_active ON public.account USING btree (active);
CREATE INDEX account_block_id ON public.account USING btree (block_id);
CREATE INDEX account_evm_address ON public.account USING btree (evm_address);
CREATE INDEX block_finalized_idx ON public.block USING btree (finalized);
CREATE INDEX block_hash_idx ON public.block USING btree (hash);
CREATE INDEX contract_extrinsic_id ON public.contract USING btree (extrinsic_id);
CREATE INDEX contract_signer ON public.contract USING btree (signer);
CREATE INDEX event_block_id ON public.event USING btree (block_id);
CREATE INDEX event_method ON public.event USING btree (method);
CREATE INDEX event_section ON public.event USING btree (section);
CREATE INDEX evm_event_block_id ON public.evm_event USING btree (block_id);
CREATE INDEX evm_event_contract_address ON public.evm_event USING btree (contract_address);
CREATE INDEX evm_event_event_id ON public.evm_event USING btree (event_id);
CREATE INDEX evm_event_method ON public.evm_event USING btree (method);
CREATE INDEX evm_event_status ON public.evm_event USING btree (status);
CREATE INDEX evm_event_topic_0 ON public.evm_event USING btree (topic_0);
CREATE INDEX evm_event_topic_1 ON public.evm_event USING btree (topic_1);
CREATE INDEX evm_event_topic_2 ON public.evm_event USING btree (topic_2);
CREATE INDEX evm_event_topic_3 ON public.evm_event USING btree (topic_3);
CREATE INDEX evm_event_type ON public.evm_event USING btree (type);
CREATE INDEX extrinsic_block_id ON public.extrinsic USING btree (block_id);
CREATE INDEX extrinsic_hash ON public.extrinsic USING btree (hash);
CREATE INDEX extrinsic_method ON public.extrinsic USING btree (method);
CREATE INDEX extrinsic_section ON public.extrinsic USING btree (section);
CREATE INDEX extrinsic_signer ON public.extrinsic USING btree (signer);
CREATE INDEX staking_event_id ON public.staking USING btree (event_id);
CREATE INDEX staking_signer ON public.staking USING btree (signer);
CREATE INDEX staking_type ON public.staking USING btree (type);
CREATE INDEX token_holder_balance ON public.token_holder USING btree (balance);
CREATE INDEX token_holder_evm_address ON public.token_holder USING btree (evm_address);
CREATE INDEX token_holder_signer ON public.token_holder USING btree (signer);
CREATE INDEX token_holder_token_address ON public.token_holder USING btree (token_address);
CREATE INDEX transfer_amount ON public.transfer USING btree (amount);
CREATE INDEX transfer_block_id ON public.transfer USING btree (block_id);
CREATE INDEX transfer_denom ON public.transfer USING btree (denom);
CREATE INDEX transfer_extrinsic_id ON public.transfer USING btree (extrinsic_id);
CREATE INDEX transfer_fee_amount ON public.transfer USING btree (fee_amount);
CREATE INDEX transfer_from_address ON public.transfer USING btree (from_address);
CREATE INDEX transfer_from_evm_address ON public.transfer USING btree (from_evm_address);
CREATE INDEX transfer_nft_id ON public.transfer USING btree (nft_id);
CREATE INDEX transfer_success ON public.transfer USING btree (success);
CREATE INDEX transfer_to_address ON public.transfer USING btree (to_address);
CREATE INDEX transfer_to_evm_address ON public.transfer USING btree (to_evm_address);
CREATE INDEX transfer_token_address ON public.transfer USING btree (token_address);
CREATE INDEX transfer_type ON public.transfer USING btree (type);
CREATE UNIQUE INDEX unique_account_nft_holder ON public.token_holder USING btree (token_address, signer, nft_id) WHERE ((evm_address IS NULL) AND (nft_id IS NOT NULL));
CREATE UNIQUE INDEX unique_account_token_holder ON public.token_holder USING btree (token_address, signer) WHERE ((evm_address IS NULL) AND (nft_id IS NULL));
CREATE UNIQUE INDEX unique_contract_nft_holder ON public.token_holder USING btree (token_address, evm_address, nft_id) WHERE ((signer IS NULL) AND (nft_id IS NOT NULL));
CREATE UNIQUE INDEX unique_contract_token_holder ON public.token_holder USING btree (token_address, evm_address) WHERE ((signer IS NULL) AND (nft_id IS NULL));
CREATE INDEX verification_request_address ON public.verification_request USING btree (address);
CREATE INDEX verification_request_filename ON public.verification_request USING btree (filename);
CREATE INDEX verification_request_name ON public.verification_request USING btree (name);
CREATE INDEX verification_request_success ON public.verification_request USING btree (success);
CREATE INDEX verified_contract_address ON public.verified_contract USING btree (address);
CREATE INDEX verified_contract_filename ON public.verified_contract USING btree (filename);
CREATE INDEX verified_contract_name ON public.verified_contract USING btree (name);
CREATE INDEX verified_contract_type ON public.verified_contract USING btree (type);
CREATE CONSTRAINT TRIGGER account_count_mod AFTER INSERT OR DELETE ON public.account DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.account_count();
CREATE TRIGGER account_count_trunc AFTER TRUNCATE ON public.account FOR EACH STATEMENT EXECUTE FUNCTION public.account_count();
CREATE CONSTRAINT TRIGGER block_count_mod AFTER INSERT OR DELETE ON public.block DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.block_count();
CREATE TRIGGER block_count_trunc AFTER TRUNCATE ON public.block FOR EACH STATEMENT EXECUTE FUNCTION public.block_count();
CREATE CONSTRAINT TRIGGER contract_count_mod AFTER INSERT OR DELETE ON public.contract DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.contract_count();
CREATE TRIGGER contract_count_trunc AFTER TRUNCATE ON public.contract FOR EACH STATEMENT EXECUTE FUNCTION public.contract_count();
CREATE CONSTRAINT TRIGGER event_count_mod AFTER INSERT OR DELETE ON public.event DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.event_count();
CREATE TRIGGER event_count_trunc AFTER TRUNCATE ON public.event FOR EACH STATEMENT EXECUTE FUNCTION public.event_count();
CREATE CONSTRAINT TRIGGER extrinsic_count_mod AFTER INSERT OR DELETE ON public.extrinsic DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.extrinsic_count();
CREATE TRIGGER extrinsic_count_trunc AFTER TRUNCATE ON public.extrinsic FOR EACH STATEMENT EXECUTE FUNCTION public.extrinsic_count();
CREATE CONSTRAINT TRIGGER transfer_count_mod AFTER INSERT OR DELETE ON public.transfer DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.transfer_count();
CREATE TRIGGER transfer_count_trunc AFTER TRUNCATE ON public.transfer FOR EACH STATEMENT EXECUTE FUNCTION public.transfer_count();
CREATE TRIGGER verified_contract_found AFTER INSERT ON public.verified_contract FOR EACH ROW EXECUTE FUNCTION public.new_verified_contract_found();
ALTER TABLE ONLY public.verified_contract
    ADD CONSTRAINT fk_address FOREIGN KEY (address) REFERENCES public.contract(address) ON DELETE CASCADE;
ALTER TABLE ONLY public.account
    ADD CONSTRAINT fk_block FOREIGN KEY (block_id) REFERENCES public.block(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.extrinsic
    ADD CONSTRAINT fk_block FOREIGN KEY (block_id) REFERENCES public.block(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.event
    ADD CONSTRAINT fk_block FOREIGN KEY (block_id) REFERENCES public.block(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.evm_event
    ADD CONSTRAINT fk_block FOREIGN KEY (block_id) REFERENCES public.block(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.transfer
    ADD CONSTRAINT fk_block FOREIGN KEY (block_id) REFERENCES public.block(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.evm_event
    ADD CONSTRAINT fk_event FOREIGN KEY (event_id) REFERENCES public.event(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.staking
    ADD CONSTRAINT fk_event FOREIGN KEY (event_id) REFERENCES public.event(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.event
    ADD CONSTRAINT fk_extrinsic FOREIGN KEY (extrinsic_id) REFERENCES public.extrinsic(id);
ALTER TABLE ONLY public.contract
    ADD CONSTRAINT fk_extrinsic FOREIGN KEY (extrinsic_id) REFERENCES public.extrinsic(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.transfer
    ADD CONSTRAINT fk_extrinsic FOREIGN KEY (extrinsic_id) REFERENCES public.extrinsic(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.transfer
    ADD CONSTRAINT fk_from_address FOREIGN KEY (from_address) REFERENCES public.account(address) ON DELETE CASCADE;
ALTER TABLE ONLY public.contract
    ADD CONSTRAINT fk_signer FOREIGN KEY (signer) REFERENCES public.account(address) ON DELETE CASCADE;
ALTER TABLE ONLY public.staking
    ADD CONSTRAINT fk_signer FOREIGN KEY (signer) REFERENCES public.account(address) ON DELETE CASCADE;
ALTER TABLE ONLY public.token_holder
    ADD CONSTRAINT fk_signer FOREIGN KEY (signer) REFERENCES public.account(address) ON DELETE CASCADE;
ALTER TABLE ONLY public.transfer
    ADD CONSTRAINT fk_to_address FOREIGN KEY (to_address) REFERENCES public.account(address) ON DELETE CASCADE;
ALTER TABLE ONLY public.transfer
    ADD CONSTRAINT fk_token_address FOREIGN KEY (token_address) REFERENCES public.contract(address) ON DELETE CASCADE;
ALTER TABLE ONLY public.token_holder
    ADD CONSTRAINT fk_verified_contract FOREIGN KEY (token_address) REFERENCES public.contract(address) ON DELETE CASCADE;
ALTER TABLE ONLY public.newly_verified_contract_queue
    ADD CONSTRAINT fk_verified_contract FOREIGN KEY (address) REFERENCES public.contract(address);
