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


## Diagnose crawler
Diagnose CPU and Memory usage through Clinic package. 

```bash
npm install -g clinic
yarn tsc
clinic doctor --on-port -- node --max-old-space-size=16384 ./dist/index.js
# After ~10 min close script using Ctrl + C
# Diagnostics will show in your default browser
```