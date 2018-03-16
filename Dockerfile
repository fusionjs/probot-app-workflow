FROM node:8.10.0@sha256:aa231490fa207f5d255007d3187a3b4e2671eb596837d84b5138505c0095267a

WORKDIR /probot-app-workflow

RUN yarn global add greenkeeper-lockfile@1

COPY package.json yarn.lock /probot-app-workflow/

RUN yarn
