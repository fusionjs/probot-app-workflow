FROM node:8.9.0

WORKDIR /probot-app-workflow

RUN yarn global add greenkeeper-lockfile@1 || true

COPY package.json yarn.lock /probot-app-workflow/

RUN yarn

RUN greenkeeper-lockfile-update || true
