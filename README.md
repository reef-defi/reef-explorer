# Reef explorer

Open source block explorer for [Reef Finance](https://reef.finance) hosted at [https://reefscan.com](https://reefscan.com)

## Dependencies

You will need `nodejs` and `yarn`, `docker` and `docker-compose`.

## Install

Install mono-repo:

```bash
git clone https://github.com/reef-defi/reef-explorer.git
cd reef-explorer
yarn
```

### Frontend

First, copy the proper frontend configuration file (mainnet or testnet):

#### Mainnet

```bash
cp frontend/frontend.config.mainnet.sample.js frontend/frontend.config.js
```

#### Testnet

```bash
cp frontend/frontend.config.tesnet.sample.js frontend/frontend.config.js
```

#### Start development frontend with hot reload

```bash
yarn workspace frontend dev
```

#### Generate static version

```bash
yarn workspace frontend generate
```

### Backend

To build and start all the required dockers.

#### Mainnet

```bash
yarn workspace backend docker:mainnet
```

#### Testnet

```bash
yarn workspace backend docker:testnet
```

#### Clean dockers

Clean all docker containers and related images and persistent volumens except those related to `substrate-node`.

```bash
yarn workspace backend docker:clean
```

#### Database backup

Create PostgreSQL database backup:

```bash
docker:postgres:backup
```

#### Create Reef-node blockchain database backup

```bash
bash docker/backend/scripts/backup.sh
```

#### Restore Reef-node database backup

```bash
bash docker/backend/scripts/restore-backup.sh
```