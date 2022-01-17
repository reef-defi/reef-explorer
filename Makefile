VOLUMES = db-data crawler-modules api-modules frontend-modules

ifeq ($(net), dev)
	NODE_CHAIN_CMD=--dev
	NODE_CHAIN=
	VOLUMES += substrate-data
else
	NODE_CHAIN_CMD=--chain
	NODE_CHAIN=$(net)
endif

ifeq ($(env), prod)
	COMPOSE-MANIFEST=docker-compose-prod.yml
else
	COMPOSE-MANIFEST=docker-compose.yml
endif

up:
	NODE_CHAIN_CMD=$(NODE_CHAIN_CMD) NODE_CHAIN=$(NODE_CHAIN) docker-compose -p reef-explorer-$(net)-$(env) -f $(COMPOSE-MANIFEST) up -d

down:
	docker-compose -p reef-explorer-$(net)-$(env) -f $(COMPOSE-MANIFEST) down

purge:
	$(foreach volume,$(VOLUMES),docker volume rm reef-explorer-$(net)-$(env)_$(volume);)
