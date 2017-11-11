FROM node:8.9.0

WORKDIR /probot-app-workflow

# Silently fail or greenkeeper will error when run locally
RUN yarn global add greenkeeper-lockfile@1 || true

COPY package.json yarn.lock /probot-app-workflow/

RUN yarn

# Silently fail or greenkeeper will error when run locally
RUN greenkeeper-lockfile-update || true
