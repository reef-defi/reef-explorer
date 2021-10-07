FROM phusion/baseimage:master-amd64

ARG REEF_NODE=v6
ARG CHAIN_SPEC=testnet-5

RUN apt-get update && apt-get install wget -y

WORKDIR /usr/local/bin

RUN wget https://github.com/reef-defi/reef-chain/releases/download/$REEF_NODE/reef-node

RUN chmod +x reef-node

WORKDIR /data

RUN wget https://github.com/reef-defi/reef-chain/releases/download/$CHAIN_SPEC/chain_spec_testnet.json

EXPOSE 30333 9933 9944

VOLUME ["/data"]

ENTRYPOINT ["reef-node"]
