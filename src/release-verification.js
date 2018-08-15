/** Copyright (c) 2017 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fetch = require('node-fetch');
const parseTitle = require('probot-app-label-release-pr/parse-title.js');

module.exports = robot => {
  robot.on('pull_request.opened', nonReleaseStatus);
  robot.on('pull_request.reopened', nonReleaseStatus);
  robot.on('pull_request.edited', nonReleaseStatus);
  robot.on('pull_request.synchronize', nonReleaseStatus);
  robot.on('pull_request.labeled', check);

  /**
   * Updates the release-verification status context for non-release PRs
   * We auto-pass the status so we can block on this status across repos.
   */
  async function nonReleaseStatus(context) {
    const {github} = context;
    const pr = context.payload.pull_request;
    const isRelease = parseTitle(pr.title);
    if (!isRelease) {
      return setStatus(context, {
        state: 'success',
        description: 'Release verification not required for this PR.',
      });
    }
  }

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

    const prerelease = isPrerelease(pr.title);
    const payload = {
      commit: 'HEAD',
      branch: 'master',
      message: `${pr.base.repo.name}, ${pr.title} - release verification`,
      author: {
        name: pr.user.login,
      },
      meta_data: {
        'release-pr-number': String(pr.number),
        'release-pr-head-sha': pr.head.sha,
        'release-pr-head-repo-full-name': pr.head.repo.full_name,
        'release-pr-base-repo-full-name': pr.base.repo.full_name,
        'release-pr-prerelease': String(prerelease),
      },
    };

    let output;

    try {
      const res = await fetch(
        'https://api.buildkite.com/v2/organizations/uberopensource/pipelines/fusion-release-verification/builds',
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            Authorization: `Bearer ${process.env.BUILDKITE_TOKEN}`,
          },
        },
      );
      output = await res.json();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(err);
    }

    github.issues.createComment(
      context.issue({
        body: `Triggered Fusion.js build verification: ${output.web_url}`,
      }),
    );

    // Ignore verification run for prereleases
    if (prerelease) {
      setStatus(context, {
        state: 'success',
        description: 'Verification run for prerelease not required.',
      });
    } else {
      setStatus(context, {
        state: 'pending',
        description: 'Waiting for verification run to finish.',
      });
    }
  }
};

// PR titles should have a dash in it to be considered a prerelease.
// E.g., v1.0.0-alpha1
function isPrerelease(prTitle) {
  return /Release v.*\-.*/.test(prTitle);
}

async function setStatus(context, {state, description}) {
  const {github} = context;
  return github.repos.createStatus(
    context.issue({
      state,
      description,
      sha: context.payload.pull_request.head.sha,
      context: 'probot/release-verification',
    }),
  );
}
