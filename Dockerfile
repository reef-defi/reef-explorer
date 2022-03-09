FROM node:fermium

ARG COMPONENT

WORKDIR /usr/app

ADD $COMPONENT/package.json yarn.lock /usr/app/

RUN yarn

CMD ["yarn", "dev"]
