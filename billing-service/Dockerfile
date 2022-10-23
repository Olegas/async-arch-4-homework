FROM node:14-alpine AS build

WORKDIR /app
COPY . /app/
RUN cd /app && yarn --frozen-lockfile && yarn build

FROM node:14-alpine

WORKDIR /app
COPY package.json yarn.lock *.json /app/
RUN cd /app && yarn --frozen-lockfile --production && yarn cache clean
COPY --from=build /app/dist/ /app/dist/

CMD ["yarn", "start:prod"]


