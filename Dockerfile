FROM node:8.11.1@sha256:26e4c77f9f797c3993780943239fa79419f011dd93ae4e0097089e2145aeaa24

WORKDIR /probot-app-workflow

RUN yarn global add greenkeeper-lockfile@1

COPY package.json yarn.lock /probot-app-workflow/

RUN yarn
