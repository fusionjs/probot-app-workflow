#!/bin/bash

set -e

yarn global add now@11.0.6
APP_URL=$(now --npm -t $NOW_TOKEN --public -e PRIVATE_KEY=@github-app-private-key -e APP_ID=@github-app-id -e BUILDKITE_TOKEN=@buildkite-token -e WEBHOOK_SECRET=@github-app-webhook-secret -e NODE_ENV="production")
now scale $APP_URL sfo 1 --token=$NOW_TOKEN
now alias set $APP_URL fusion-monorepo-probot -t $NOW_TOKEN
now rm probot-app-workflow --safe -t $NOW_TOKEN -y
