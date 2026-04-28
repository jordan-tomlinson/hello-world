FROM node:22-alpine

WORKDIR /usr/src/app

COPY server.js .

EXPOSE 3000

CMD ["node", "server.js"]