#!/bin/bash

set -ex

yarn global add now@9.0.1 now-replace
APP_URL=$(now --npm -t $NOW_TOKEN --public -e PRIVATE_KEY=@private-key -e APP_ID=@app-id -e BUILDKITE_TOKEN=@buildkite-token -e WEBHOOK_SECRET=@webhook-secret -e NODE_ENV="production")
now scale $APP_URL 1 -t $NOW_TOKEN
now-replace fusion-probot $APP_URL -t $NOW_TOKEN
