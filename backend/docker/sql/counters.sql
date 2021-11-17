--
-- Fast counters
--
-- Taken from https://www.cybertec-postgresql.com/en/postgresql-count-made-fast/
--

-- Block
START TRANSACTION;
CREATE FUNCTION block_count() RETURNS trigger LANGUAGE plpgsql AS
$$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE total SET count = count + 1 WHERE name = 'blocks';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE total SET count = count - 1 WHERE name = 'blocks';
    RETURN OLD;
  ELSE
    UPDATE total SET count = 0 WHERE name = 'blocks';
    RETURN NULL;
  END IF;
END;$$;
CREATE CONSTRAINT TRIGGER block_count_mod
  AFTER INSERT OR DELETE ON block
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE PROCEDURE block_count();
-- TRUNCATE triggers must be FOR EACH STATEMENT
CREATE TRIGGER block_count_trunc AFTER TRUNCATE ON block
  FOR EACH STATEMENT EXECUTE PROCEDURE block_count();
-- initialize the counter table
UPDATE total SET count = (SELECT count(*) FROM block) WHERE name = 'blocks';
COMMIT;

-- Extrinsics
START TRANSACTION;
CREATE FUNCTION extrinsic_count() RETURNS trigger LANGUAGE plpgsql AS
$$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE total SET count = count + 1 WHERE name = 'extrinsics';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE total SET count = count - 1 WHERE name = 'extrinsics';
    RETURN OLD;
  ELSE
    UPDATE total SET count = 0 WHERE name = 'extrinsics';
    RETURN NULL;
  END IF;
END;$$;
CREATE CONSTRAINT TRIGGER extrinsic_count_mod
  AFTER INSERT OR DELETE ON extrinsic
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE PROCEDURE extrinsic_count();
-- TRUNCATE triggers must be FOR EACH STATEMENT
CREATE TRIGGER extrinsic_count_trunc AFTER TRUNCATE ON extrinsic
  FOR EACH STATEMENT EXECUTE PROCEDURE extrinsic_count();
-- initialize the counter table
UPDATE total SET count = (SELECT count(*) FROM extrinsic) WHERE name = 'extrinsics';
COMMIT;


-- Events
START TRANSACTION;
CREATE FUNCTION event_count() RETURNS trigger LANGUAGE plpgsql AS
$$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE total SET count = count + 1 WHERE name = 'events';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE total SET count = count - 1 WHERE name = 'events';
    RETURN OLD;
  ELSE
    UPDATE total SET count = 0 WHERE name = 'events';
    RETURN NULL;
  END IF;
END;$$;
CREATE CONSTRAINT TRIGGER event_count_mod
  AFTER INSERT OR DELETE ON event
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE PROCEDURE event_count();
-- TRUNCATE triggers must be FOR EACH STATEMENT
CREATE TRIGGER event_count_trunc AFTER TRUNCATE ON event
  FOR EACH STATEMENT EXECUTE PROCEDURE event_count();
-- initialize the counter table
UPDATE total SET count = (SELECT count(*) FROM event) WHERE name = 'events';
COMMIT;

-- Contracts
START TRANSACTION;
CREATE FUNCTION contract_count() RETURNS trigger LANGUAGE plpgsql AS
$$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE total SET count = count + 1 WHERE name = 'contracts';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE total SET count = count - 1 WHERE name = 'contracts';
    RETURN OLD;
  ELSE
    UPDATE total SET count = 0 WHERE name = 'contracts';
    RETURN NULL;
  END IF;
END;$$;
CREATE CONSTRAINT TRIGGER contract_count_mod
  AFTER INSERT OR DELETE ON contract
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE PROCEDURE contract_count();
-- TRUNCATE triggers must be FOR EACH STATEMENT
CREATE TRIGGER contract_count_trunc AFTER TRUNCATE ON contract
  FOR EACH STATEMENT EXECUTE PROCEDURE contract_count();
-- initialize the counter table
UPDATE total SET count = (SELECT count(*) FROM contract) WHERE name = 'contracts';
COMMIT;

-- Transfers
START TRANSACTION;
CREATE FUNCTION transfer_count() RETURNS trigger LANGUAGE plpgsql AS
$$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE total SET count = count + 1 WHERE name = 'transfers';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE total SET count = count - 1 WHERE name = 'transfers';
    RETURN OLD;
  ELSE
    UPDATE total SET count = 0 WHERE name = 'transfers';
    RETURN NULL;
  END IF;
END;$$;
CREATE CONSTRAINT TRIGGER transfer_count_mod
  AFTER INSERT OR DELETE ON transfer
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE PROCEDURE transfer_count();
-- TRUNCATE triggers must be FOR EACH STATEMENT
CREATE TRIGGER transfer_count_trunc AFTER TRUNCATE ON transfer
  FOR EACH STATEMENT EXECUTE PROCEDURE transfer_count();
-- initialize the counter table
UPDATE total SET count = (SELECT count(*) FROM transfer) WHERE name = 'transfers';
COMMIT;

-- ERC-20 tokens
START TRANSACTION;
CREATE FUNCTION token_count() RETURNS trigger LANGUAGE plpgsql AS
$$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE total SET count = count + 1 WHERE name = 'tokens';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE total SET count = count - 1 WHERE name = 'tokens';
    RETURN OLD;
  ELSE
    UPDATE total SET count = 0 WHERE name = 'tokens';
    RETURN NULL;
  END IF;
END;$$;
CREATE CONSTRAINT TRIGGER token_count_mod
  AFTER INSERT OR DELETE ON erc20
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE PROCEDURE token_count();
-- TRUNCATE triggers must be FOR EACH STATEMENT
CREATE TRIGGER token_count_trunc AFTER TRUNCATE ON erc20
  FOR EACH STATEMENT EXECUTE PROCEDURE token_count();
-- initialize the counter table
UPDATE total SET count = (SELECT count(*) FROM erc20) WHERE name = 'tokens';
COMMIT;