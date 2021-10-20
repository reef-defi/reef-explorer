FROM phusion/baseimage:master-amd64

ARG REEF_NODE=mainnet-1
ARG CHAIN_SPEC=mainnet-1

RUN apt-get update && apt-get install wget -y

WORKDIR /usr/local/bin

RUN wget https://github.com/reef-defi/reef-chain/releases/download/$REEF_NODE/reef-node

RUN chmod +x reef-node

WORKDIR /data

RUN wget https://github.com/reef-defi/reef-chain/releases/download/$CHAIN_SPEC/chain_spec_mainnet.json

EXPOSE 30333 9933 9944

VOLUME ["/data"]

ENTRYPOINT ["reef-node"]
