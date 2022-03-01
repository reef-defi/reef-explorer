
ifeq ($(env), prod)
	COMPOSE-MANIFEST=docker-compose-prod.yml
else
	COMPOSE-MANIFEST=docker-compose.yml
endif



up:
	export $$(cat $(net).env | xargs) && docker-compose -p reef-explorer-$(net)-$(env) -f $(COMPOSE-MANIFEST) up -d

down:
	docker-compose -p reef-explorer-$(net)-$(env) -f $(COMPOSE-MANIFEST) down

purge:
	$(foreach volume,$(VOLUMES),docker volume rm reef-explorer-$(net)-$(env)_$(volume);)
