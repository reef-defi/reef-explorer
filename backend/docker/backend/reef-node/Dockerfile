FROM phusion/baseimage:master-amd64

RUN apt-get update && apt-get install wget -y

WORKDIR /usr/local/bin

RUN wget https://github.com/reef-defi/reef-chain/releases/download/testnet-2.1/reef-node

RUN chmod +x reef-node

EXPOSE 30333 9933 9944

VOLUME ["/data"]

ENTRYPOINT ["reef-node"]
