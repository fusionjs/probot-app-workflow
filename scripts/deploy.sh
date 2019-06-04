#!/bin/bash

set -e

team=$NOW_TEAM
token=$NOW_TOKEN
org="fusionjs"
app_name="$org-bot"

app_url=$(now --npm --name=$app_name -T $team -t $token --public -e PRIVATE_KEY="@probot-$org-private-key" -e APP_ID="@probot-$org-app-id" -e WEBHOOK_SECRET="@probot-$org-webhook-secret" -e BUILDKITE_TOKEN=@buildkite-token -e GH_TOKEN="$GH_TOKEN" -e REPO_RELATIONSHIPS="$REPO_RELATIONSHIPS"-e REPO_WHITELIST="$REPO_WHITELIST"  -e NODE_ENV="production")
now scale $app_url sfo 1 -T $team --token=$token
now alias set $app_url $app_name -T $team -t $token
now rm $app_name --safe -T $team -t $token -y || true
