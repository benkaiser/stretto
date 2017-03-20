FROM node:6-slim
RUN mkdir /app
ADD package.json yarn.lock /app/
WORKDIR /app
RUN yarn
