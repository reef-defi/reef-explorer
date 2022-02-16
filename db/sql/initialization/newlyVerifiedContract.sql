
CREATE TABLE IF NOT EXISTS newly_verified_contract_queue (
  address VARCHAR(48),
  CONSTRAINT fk_verified_contract
    FOREIGN KEY (address)
      REFERENCES contract(address)
      ON DELETE NO ACTION
);

CREATE FUNCTION new_verified_contract_found() 
  RETURNS TRIGGER 
  LANGUAGE PLPGSQL
AS $$
BEGIN
	INSERT INTO newly_verified_contract_queue (address) VALUES (NEW.address);
  RETURN NEW;
END;
$$;

CREATE TRIGGER verified_contract_found AFTER INSERT ON verified_contract
  FOR EACH ROW EXECUTE FUNCTION new_verified_contract_found();
