FROM node:18-alpine3.15

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3001