FROM node:fermium

WORKDIR /usr/app/crawler

COPY package.json /usr/app/crawler/

RUN yarn

COPY . /usr/app/crawler/

CMD ["yarn", "prod"]
