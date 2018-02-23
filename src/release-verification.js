/** Copyright (c) 2017 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const exec = require('child_process').exec;

module.exports = robot => {
  robot.on('pull_request.labeled', check);

  async function check(context) {
    const {github} = context;
    const pr = context.payload.pull_request;

    // set status to pending while checks happen
    setStatus(context, {
      state: 'pending',
      description: 'Checking whether to start a verification build.',
    });

    const isRelease = context.payload.label.name === 'release';
    if (!isRelease) {
      return setStatus(context, {
        state: 'success',
        description: 'Verification run is not necessary.',
      });
    }

    const curlCommand = `curl \
    -H "Authorization: Bearer ${process.env.BUILDKITE_TOKEN}" \
    -X POST "https://api.buildkite.com/v2/organizations/uberopensource/pipelines/fusion-release-verification/builds" \
      -d '{
        "commit": "HEAD",
        "branch": "master",
        "message": "${pr.base.repo.name}, ${pr.title} - release verification",
        "author": {
          "name": "${pr.user.login}"
        }
      }'`;

    exec(curlCommand, (error, stdout) => {
      if (error !== null) {
        // eslint-disable-next-line no-console
        console.warn('exec error: ' + error);
      }
      const output = JSON.parse(stdout);
      github.issues.createComment(
        context.issue({
          body: `Triggered Fusion.js build verification: ${output.web_url}`,
        }),
      );
    });

    // set status to success
    setStatus(context, {
      state: 'success',
      description: 'Verification run has been started.',
    });
  }
};

async function setStatus(context, {state, description}) {
  const {github} = context;
  return github.repos.createStatus(
    context.issue({
      state,
      description,
      sha: context.payload.pull_request.head.sha,
      context: 'probot/label-release-pr',
    }),
  );
}
