FROM node:20-alpine

WORKDIR /app

# install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# copy source code
COPY . .

EXPOSE 8080

CMD ["npm", "start"]