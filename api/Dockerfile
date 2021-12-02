FROM node:fermium

WORKDIR /usr/app/api

COPY . .

RUN yarn 

EXPOSE 8000
CMD ["yarn", "start"]
