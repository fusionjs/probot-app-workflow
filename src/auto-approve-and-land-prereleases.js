/** Copyright (c) 2017 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = robot => {
  robot.on('pull_request.opened', handleApproval);
  robot.on('pull_request.reopened', handleApproval);
  robot.on('pull_request.edited', handleApproval);
  robot.on('pull_request.synchronize', handleApproval);
  robot.on('pull_request.labeled', handleApproval);

  /**
   * Approves and lands pull requests that match:
   *    - Is a pre-release
   *    - Authored by a member of the 'fusionjs' organization on GitHub
   */
  async function handleApproval(context) {
    const {github} = context;
    const pr = context.payload.pull_request;

    const isPrerelease = getIsPrerelease(pr.title);
    const isMemberOfFusionOrg = await getIsMemberOfOrg(github, 'fusionjs', pr.user.login);
    if(!(isPrerelease && isMemberOfFusionOrg)) return;

    // Approve the pull request
    github.pullRequests.createReview(
      context.issue({
        event: "APPROVE"
      })
    );

    // Attempt to merge the pull request
    github.pullRequests.merge(context.issue());
  }
};

/* Helper functions */

/*
 * Gets whether the provided pr title should be considered a pre-release.
 * 
 * Note: PR titles should have a dash in it to be considered a prerelease.
 *   e.g., v1.0.0-alpha1
 */
function getIsPrerelease(prTitle) {
  return /Release v.*\-.*/.test(prTitle);
}

/*
 * Gets whether the provided username is a member of the provided organization.
 */
async function getIsMemberOfOrg(github, org, username) {
  try {
    // Succeeds with a status 204 code, otherwise fails with 404 / 302.
    //
    // See docs for more details:
    //   https://developer.github.com/v3/orgs/members/#check-membership
    const response = await github.orgs.checkMembership({
      org: org,
      username: username
    });
    return response.status === 204;
  } catch (e) {
    return false;
  }
}
