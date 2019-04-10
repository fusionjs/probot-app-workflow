#!/bin/bash

set -e

team=$NOW_TEAM
token=$NOW_MONOREPO_TOKEN

yarn global add now@11.0.6
APP_URL=$(now --npm --name=fusion-monorepo-bot -T $team -t $token --public -e PRIVATE_KEY=@github-app-private-key -e APP_ID=@github-app-id -e BUILDKITE_TOKEN=@buildkite-token -e WEBHOOK_SECRET=@github-app-webhook-secret -e NODE_ENV="production")
now scale $APP_URL sfo 1 -T $team --token=$token
now alias set $APP_URL fusion-monorepo-bot -T $team -t $token
now rm fusion-monorepo-bot --safe -T $team -t $token -y
