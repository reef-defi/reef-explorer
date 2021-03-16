FROM phusion/baseimage:master-amd64

RUN apt-get update && apt-get install wget -y

WORKDIR /usr/local/bin

COPY reef-node reef-node

RUN chmod +x reef-node

EXPOSE 30333 9933 9944

VOLUME ["/data"]

ENTRYPOINT ["reef-node"]
