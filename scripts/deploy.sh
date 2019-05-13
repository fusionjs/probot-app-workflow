#!/bin/bash

set -e

orgs=(`echo $ORG_LIST`)
team=$NOW_TEAM
token=$NOW_TOKEN

yarn global add now@11.0.6
# we use private github apps for this bot, which can't be installed on
# multiple orgs, so we need a separate deployment for each org
for org in "${orgs[@]}"; do
  app_name="$org-bot"
  app_url=$(now --npm --name=$app_name -T $team -t $token --public -e PRIVATE_KEY="@probot-$org-private-key" -e APP_ID="@probot-$org-app-id" -e WEBHOOK_SECRET="@probot-$org-webhook-secret" -e BUILDKITE_TOKEN=@buildkite-token -e GH_TOKEN="$GH_TOKEN" -e REPO_RELATIONSHIPS="$REPO_RELATIONSHIPS" -e NODE_ENV="production")
  now scale $app_url sfo 1 -T $team --token=$token
  now alias set $app_url $app_name -T $team -t $token
  now rm $app_name --safe -T $team -t $token -y || true
done
