FROM node:8.10.0@sha256:a95cbb8c0d34bb8c19cff50ec515672d95106299f8f2fc8ccde2079e3ba55702

WORKDIR /probot-app-workflow

RUN yarn global add greenkeeper-lockfile@1

COPY package.json yarn.lock /probot-app-workflow/

RUN yarn
