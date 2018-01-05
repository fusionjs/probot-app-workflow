FROM node:8.9.4@sha256:19cc0100af8c67406f70cb1c27700e9c958d3d0ee2982e2ca0563d7bb8abf319

WORKDIR /probot-app-workflow

RUN yarn global add greenkeeper-lockfile@1

COPY package.json yarn.lock /probot-app-workflow/

RUN yarn
