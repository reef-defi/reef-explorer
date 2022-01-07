FROM node:fermium

WORKDIR /usr/app

ADD package.json yarn.lock /usr/app/

RUN yarn

CMD ["yarn", "dev"]
