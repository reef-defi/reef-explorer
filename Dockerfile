FROM node:fermium

ARG COMPONENT

WORKDIR /usr/app

RUN wget https://raw.githubusercontent.com/eficode/wait-for/v2.2.2/wait-for -O /wait-for && chmod +x /wait-for

ADD $COMPONENT/package.json yarn.lock /usr/app/

RUN yarn

CMD ["/wait-for", "http://graphql:8080/healthz", "-t", "0", "--", "yarn", "dev"]
