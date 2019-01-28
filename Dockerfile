FROM uber/web-base-image:2.0.2

WORKDIR /probot-app-workflow

RUN yarn global add greenkeeper-lockfile@1

COPY package.json yarn.lock /probot-app-workflow/

RUN yarn
