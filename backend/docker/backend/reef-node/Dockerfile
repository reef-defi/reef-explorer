FROM phusion/baseimage:master-amd64

RUN apt-get update && apt-get install wget -y

WORKDIR /usr/local/bin

RUN wget https://raw.githubusercontent.com/reef-defi/reef-explorer/main/backend/docker/backend/reef-node/reef-node \
    && chmod +x reef-node

EXPOSE 30333 9933 9944

VOLUME ["/data"]

ENTRYPOINT ["reef-node"]
