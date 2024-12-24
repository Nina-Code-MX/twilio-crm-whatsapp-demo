FROM node:20.18

WORKDIR /app

COPY ./dist /app/dist
COPY ./package.json /app
COPY ./.env /app

RUN npm install --production

EXPOSE 3000

CMD ["node", "dist/server.js"]