# Reef explorer

Open source block explorer for [Reef chain](https://reef.io) hosted at [https://reefscan.com](https://reefscan.com)

The `reef-explorer` stack is containerised using docker and is run using a 
container orchestration tool.  We have provided a docker-compose manifest to run
the stack.  Operation using `Makefile` can be see below:

To start:
```
make net=testnet env=prod up
```

To stop:
```
make net=testnet env=prod down
```

To purge data:
```
make net=testnet env=prod purge
```

To re/build specific container:
```
make net=testnet env=prod serv=crawler build
```

To launch hasura console:
```
make hasura
```

To re/populate the data using a script in `crawler/populate` folder:
```
make net=testnet env=prod script=staking populate
```

net can take the following options:
- dev
- testnet
- mainnet

env can take the following options:
- dev - provides hot reloading capabilties useful for development
- prod - uses production ready patterns to generate images

That will build and start all the required dockers:

- PostgreSQL
- Hasura GraphQL server
- Reef chain node
- Nodejs crawler
- API


## Local dependencies

In Ubuntu 20.04 server you can do:

```
apt update
apt upgrade
apt install git build-essential apt-transport-https ca-certificates curl software-properties-common libpq-dev

# docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
apt update
apt install docker-ce

# docker-compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# node v14
curl -sL https://deb.nodesource.com/setup_14.x -o nodesource_setup.sh
bash nodesource_setup.sh
apt install nodejs

# yarn
npm install --global yarn
```

## Install

Install mono-repo:

```bash
git clone https://github.com/reef-defi/reef-explorer.git
cd reef-explorer
yarn
```


### Nginx configuration

You can use Nginx as a inverse proxy for Hasura GraphQL and also to serve the static frontend.

Example nginx config `/etc/nginx/sites-available/default` with SSL enabled using Certbot:

```
server {
    root /usr/local/reef-explorer/frontend/dist;
    index index.html index.htm index.nginx-debian.html;
    server_name yourdomain.io;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/erc20 {
      proxy_pass http://localhost:8000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }

    location /api/token/ {
      proxy_pass http://localhost:8000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }

    location /api/contract/ {
      proxy_pass http://localhost:8000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }

    location /api/token-balance/ {
      proxy_pass http://localhost:8000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }

    location /api/account/tokens/ {
      proxy_pass http://localhost:8000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }

    location /api/account/:address/owned-tokens/ {
      proxy_pass http://localhost:8000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }

    location /api/account/:address/available-tokens {
      proxy_pass http://localhost:8000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }

    location /api/verificator/status {
      proxy_pass http://localhost:8000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }

    location /api/verificator/form-verification {
      proxy_pass http://localhost:8000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }

    location /api/verificator/submit-verification {
      proxy_pass http://localhost:8000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }

    location /api/verificator/contract/:address {
      proxy_pass http://localhost:8000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }

    location /api/crawler/status {
      proxy_pass http://localhost:8000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }



    listen [::]:443 ssl ipv6only=on;
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/yourdomain.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.io/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = yourdomain.io) {
        return 301 https://$host$request_uri;
    }
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name yourdomain.io;
    return 404;
}
```

Apply your new configuration:

```
ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
systemctl restart nginx
```

### Frontend

First, copy the proper frontend configuration file (mainnet or testnet):

#### Mainnet

```bash
cp frontend/frontend.config.mainnet.sample.js frontend/frontend.config.js
```

#### Testnet

```bash
cp frontend/frontend.config.testnet.sample.js frontend/frontend.config.js
```

#### Start development frontend with hot reload

```bash
yarn workspace frontend dev
```

#### Generate static version

```bash
yarn workspace frontend generate
```

# Release notes

## `v10`
In the `v10` release, we introduced new populating command, which allows users to run scripts to re/populate the DB. When populating data it is highly recommended that the crawling process is stopped with additional backup in place.

Example of how to repopulate staking rewards:
```
make net=testnet env=prod script=staking populate
```
Populate staking script is saved in `crawler/populate/populate_staking.js` and its purpose is to repair old staking rewards and their destination addresses. 
