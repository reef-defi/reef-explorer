#!/bin/sh

set -ex

make net=dev env=prod up
docker-compose --env-file .env -f resources/docker-compose-integration.yml run hardhat_examples
