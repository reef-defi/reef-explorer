-- SELECT last_value FROM pool_event_serail_id;
DROP SEQUENCE pool_event_sequence;
CREATE SEQUENCE pool_event_sequence START 1;
DELETE FROM pool WHERE id > 0;
DELETE FROM pool_event WHERE id > 0;

-- SELECT * from pool_event_sequence;
-- SELECT currval('pool_event_sequence')
-- SELECT count(*) FROM pool_event;