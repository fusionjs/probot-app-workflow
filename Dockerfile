FROM node:8.11.3@sha256:04986974434fc565529feaac1d62cce4f9fe99ba4906f076ce498000120a45d4

ENV YARN_VERSION 1.13.0

WORKDIR /probot-app-workflow

RUN yarn global add greenkeeper-lockfile@1

COPY package.json yarn.lock /probot-app-workflow/

RUN yarn
