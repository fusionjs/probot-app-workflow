FROM node:8.11.1@sha256:4fe84bf04ebb3da3ff5e6524db3dd5085eb3c61a85928b594924aae8529f376f

WORKDIR /probot-app-workflow

RUN yarn global add greenkeeper-lockfile@1

COPY package.json yarn.lock /probot-app-workflow/

RUN yarn
