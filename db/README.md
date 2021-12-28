# Reefexplorer Database & GraphQL

A Postgres DB is use for persistence of historical reef blockchain data.  
The postgres schema migrations can be found in `/sql`.  We also leverage a
GraphQL api to allow users to query historical data stored in postgres.  The
GraphQL metadata can be found in `/hasura`.

## To run
To run postgres DB & GraphQL API use the `Makefile` in the parent directory:

```
make env=dev up
```

## Hasura console
You will need to install the Hasura-cli:
```
curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh | bash
```

To enter into hasura console you should run the stack using the `Makefile` method 
described in above section.  Then:
```
cd reef-explorer/db/hasura
hasura console
```
