FROM node:22

WORKDIR /app-pong

COPY pongGame/package*.json ./

RUN npm install

COPY pongGame ./

RUN npm run build

EXPOSE ${PORT_PONG}

CMD [ "npm", "run", "start" ]
