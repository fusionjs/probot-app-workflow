/** Copyright (c) 2017 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fetch = require('node-fetch');
const parseTitle = require('probot-app-label-release-pr/parse-title.js');

const ORG_WHITELIST = (whitelist =>
  whitelist ? whitelist.split(',') : []
)(process.env.RELEASE_VERIFICATION_ORG_WHITELIST);

module.exports = robot => {
  robot.on('pull_request.opened', nonReleaseStatus);
  robot.on('pull_request.reopened', nonReleaseStatus);
  robot.on('pull_request.edited', nonReleaseStatus);
  robot.on('pull_request.synchronize', nonReleaseStatus);
  robot.on('pull_request.closed', handleClosedPR);
  robot.on('pull_request.labeled', checkReleaseLabel);

  /**
   * Updates the release-verification status context for non-release PRs
   * We auto-pass the status so we can block on this status across repos.
   */
  async function nonReleaseStatus(context) {
    if (!getIsWhitelisted(context.payload)) {
      return;
    }

    const {github} = context;
    const pr = context.payload.pull_request;
    const isRelease = parseTitle(pr.title);
    if (!isRelease) {
      return setStatus(context, {
        state: 'success',
        description: 'Verification not required for this PR.',
      });
    }
  }

  async function handleClosedPR(context) {
    if (!getIsWhitelisted(context.payload)) {
      return;
    }

    const {github} = context;
    const pr = context.payload.pull_request;

    // Release (and pre-release) PRs are handled in real time (a la when 'release' label added)
    const isRelease = parseTitle(pr.title);
    const isPrerelease = getIsPrerelease(pr.title);
    if(isRelease || isPrerelease) return;

    // Kick off a new verification build after code is merged into master
    const isMerged = context.payload.action === 'closed' && context.payload.pull_request.merged === true;
    if(!isMerged) return;

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
        'release-pr-prerelease': String(false),
        'is-release-pr': String(false)
      },
    };

    return triggerBuildVerification(context, payload);
  }

  async function checkReleaseLabel(context) {
    if (!getIsWhitelisted(context.payload)) {
      return;
    }

    const {github} = context;
    const pr = context.payload.pull_request;

    // set status to pending while checks happen
    setStatus(context, {
      state: 'pending',
      description: 'Checking whether to start a verification build.',
    });

    const hasReleaseLabel = context.payload.label.name === 'release';
    const isPrerelease = getIsPrerelease(pr.title);

    // Ignore verification run for non-releases
    if (!hasReleaseLabel) {
      return setStatus(context, {
        state: 'success',
        description: 'Verification not required for this pull request.',
      });
    }

    // For pre-releases, set status to 'success' but still kick off build verification
    if(isPrerelease) {
      setStatus(context, {
        state: 'success',
        description: 'Verification not required for pre-releases.',
      });
    } else { // otherwise, this is a release that requires build verification
      setStatus(context, {
        state: 'pending',
        description: 'Waiting for verification run to finish.',
      });
    }

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
        'release-pr-prerelease': String(isPrerelease),
        'is-release-pr': String(hasReleaseLabel && !isPrerelease)
      },
    };

    return triggerBuildVerification(context, payload);
  }
};

function getIsWhitelisted(payload) {
  return !ORG_WHITELIST.length || ORG_WHITELIST.includes(payload.repository.owner.login);
}

// PR titles should have a dash in it to be considered a prerelease.
// E.g., v1.0.0-alpha1
function getIsPrerelease(prTitle) {
  return /Release v.*\-.*/.test(prTitle);
}

// Triggers the build verification job with the provided payload
async function triggerBuildVerification(context, payload) {
  const {github} = context;
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
      }
    );
    output = await res.json();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(err);
  }

  github.issues.createComment(
    context.issue({
      body: `Triggered Fusion.js build verification: ${output.web_url}`,
    })
  );
}

async function setStatus(context, {state, description}) {
  const {github} = context;
  return github.repos.createStatus(
    context.issue({
      state,
      description,
      sha: context.payload.pull_request.head.sha,
      context: 'probot/release-verification',
    })
  );
}
