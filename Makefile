VOLUMES = db-data crawler-modules api-modules frontend-modules
ifeq ($(env), dev)
	NODE_CHAIN_CMD=--dev
	NODE_CHAIN=
	VOLUMES += substrate-data
else
	NODE_CHAIN_CMD=--chain
	NODE_CHAIN=$(env)
endif

up:
	NODE_CHAIN_CMD=$(NODE_CHAIN_CMD) NODE_CHAIN=$(NODE_CHAIN) docker-compose -p reef-explorer-$(env) up -d

down:
	docker-compose -p reef-explorer-$(env) down

purge:
	$(foreach volume,$(VOLUMES),docker volume rm reef-explorer-$(env)_$(volume);)
