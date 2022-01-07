FROM node:fermium

WORKDIR /usr/app

ADD package.json yarn.lock /usr/app/

RUN yarn 

EXPOSE 8000

CMD ["yarn", "dev"]
