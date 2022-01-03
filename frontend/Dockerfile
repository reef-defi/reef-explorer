FROM node:fermium

WORKDIR /usr/app/

ADD package.json yarn.lock /usr/app/

RUN yarn

ENV HOST 0.0.0.0

CMD ["yarn", "dev"]
