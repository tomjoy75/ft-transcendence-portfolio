FROM node:22

#Create a app directory
WORKDIR /app-back

#Install app depedencies
COPY package*.json ./

#Run npm install
RUN npm install

#Bundle app source
COPY . .

EXPOSE ${PORT_BACK}

CMD [ "npm", "run", "start" ]