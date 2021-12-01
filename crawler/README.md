# Reef-crawler

Crawles reef node from multiple node providers. 
Provider urls can currently be modified in `utils/connector.ts`.

Crawled data is then saved into db from: `0.0.0.0:54321`.


Currently crawler works linearly and is adjusted to proces "block after block".
V2 is going to be a harvesting speed up to capture multiple blocks at once.

## Installation

`cd crawler`
`yarn`

## Run crawler

`yarn start`
