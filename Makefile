
VOLUMES = db-data crawler-modules backtracking-modules api-modules frontend-modules

ifeq ($(env), dev)
	VOLUMES += substrate-data
endif

ifeq ($(env), prod)
	COMPOSE-MANIFEST=docker-compose-prod.yml
else
	COMPOSE-MANIFEST=docker-compose.yml
endif

up:
	export $$(cat .env.$(net) | xargs) && docker-compose -p reef-explorer-$(net)-$(env) -f $(COMPOSE-MANIFEST) up -d

down:
	docker-compose -p reef-explorer-$(net)-$(env) -f $(COMPOSE-MANIFEST) down

purge:
	$(foreach volume,$(VOLUMES),docker volume rm reef-explorer-$(net)-$(env)_$(volume);)

hasura:
	export $$(cat .env | xargs) && cd db/hasura && hasura console --admin-secret $$GQL_ADMIN_PW
