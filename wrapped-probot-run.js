/** Copyright (c) 2019 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const bodyParser = require('body-parser');
const express = require('express');
const get = require('just-safe-get');
const {Probot} = require('probot');

const WHITELIST = new Set(
  (process.env.PROBOT_REPO_WHITELIST || '').split(/, ?/)
);

// this behaves exactly like the `probot run` command, except it
// wraps the internal probot server so it can intercept webhooks
// from non-whitelisted repos and prevent them from being handled
// by our bots
Probot.run(process.argv)
  .then(probot => {
    const server = express();

    server.use(bodyParser.json());
    server.use((req, res, next) => {
      if (req.method === 'POST') {
        const repoName = get(req.body, 'repository.full_name');

        if (repoName && !WHITELIST.has(repoName)) {
          // non-whitelisted repo tried to send webhook; ignore it
          res.json({});
          return;
        }
      }

      next();
    });

    // ref: https://github.com/probot/probot/blob/ade14ae/src/index.ts#L208
    probot.httpServer.close();
    server.use(probot.server);
    probot.httpServer = server.listen(probot.options.port);
  })
  .catch(console.error);
