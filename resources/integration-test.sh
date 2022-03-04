#!/bin/sh

set -ex

make net=dev env=dev up
docker-compose --env-file .env -f resources/docker-compose-integration.yml run hardhat_examples
