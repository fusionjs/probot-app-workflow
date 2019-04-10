#!/bin/bash

set -e

yarn global add now@11.0.6
APP_URL=$(now --npm --name=fusion-monorepo-bot -t $NOW_MONOREPO_TOKEN --public -e PRIVATE_KEY=@github-app-private-key -e APP_ID=@github-app-id -e BUILDKITE_TOKEN=@buildkite-token -e WEBHOOK_SECRET=@github-app-webhook-secret -e NODE_ENV="production")
now scale $APP_URL sfo 1 --token=$NOW_MONOREPO_TOKEN
now alias set $APP_URL fusion-monorepo-bot -t $NOW_MONOREPO_TOKEN
now rm fusion-monorepo-bot --safe -t $NOW_MONOREPO_TOKEN -y
