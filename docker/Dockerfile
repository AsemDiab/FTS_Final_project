
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm i

COPY . .

EXPOSE 8080
CMD ["npm", "run", "ts-dev"]
