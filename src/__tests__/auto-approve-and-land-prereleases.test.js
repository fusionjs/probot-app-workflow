import {Application} from 'probot';
import app from '../auto-approve-and-land-prereleases.js';

import nonReleasePayload from './fixtures/non-release-payload.json';
import prereleasePayload from './fixtures/prerelease-payload.json';
import statusPendingBuildPayload from './fixtures/status-pending-build-payload.json';
import statusPendingNonBuildPayload from './fixtures/status-pending-non-build-payload.json';

describe('auto-approve-and-land-prereleases', () => {
  let robot;
  let github;

  beforeEach(() => {
    robot = new Application();
    robot.load(app);
    github = {
      issues: {
        createComment: jest.fn(),
      },
      pullRequests: {
        createReview: jest.fn(),
        merge: jest.fn()
      },
      orgs: {
        checkMembership: jest.fn().mockReturnValue(Promise.resolve({ status: 204 }))
      }
    };
    // Passes the mocked out GitHub API into out robot instance
    robot.auth = () => Promise.resolve(github);
  });

  it('non-approval for non-release payload', async () => {
    await robot.receive({
      event: 'pull_request',
      payload: nonReleasePayload,
    });

    // Should silently fail with no approval/merge
    const createReviewCalls = github.pullRequests.createReview.mock.calls;
    const mergeCalls = github.pullRequests.merge.mock.calls;
    expect(createReviewCalls.length).toBe(0);
    expect(mergeCalls.length).toBe(0);
  });

  it('approval for pre-release payload', async () => {
    await robot.receive({
      event: 'pull_request',
      payload: prereleasePayload,
    });

    // Should approve and merge
    expect(github.pullRequests.createReview).toHaveBeenCalled();
    expect(github.pullRequests.merge).toHaveBeenCalled();
  });

  it('non-approval for pre-release payload with invalid user', async () => {
    github = {
      issues: {
        createComment: jest.fn(),
      },
      pullRequests: {
        createReview: jest.fn(),
        merge: jest.fn()
      },
      orgs: {
        checkMembership: jest.fn().mockReturnValue(Promise.resolve({ status: 404 }))
      }
    };
    // Passes the mocked out GitHub API into out robot instance
    robot.auth = () => Promise.resolve(github);
    
    await robot.receive({
      event: 'pull_request',
      payload: prereleasePayload,
    });
    
    // Should silently fail with no approval/merge
    const createReviewCalls = github.pullRequests.createReview.mock.calls;
    const mergeCalls = github.pullRequests.merge.mock.calls;
    expect(createReviewCalls.length).toBe(0);
    expect(mergeCalls.length).toBe(0);
  });

  it('skip required build check', async () => {
    github = {
      repos: {
        createStatus: jest.fn().mockReturnValue(Promise.resolve(true)),
      },
    };
    // Passes the mocked out GitHub API into out robot instance
    robot.auth = () => Promise.resolve(github);
    
    await robot.receive({
      event: 'status',
      payload: statusPendingBuildPayload,
    });
    
    // Should immediately set success
    const statusCalls = github.repos.createStatus.mock.calls;
    expect(github.repos.createStatus).toHaveBeenCalled();
    expect(statusCalls.length).toBe(1);
    expect(statusCalls[0][0].state).toBe('success');
  });

  it('no op on non-build status checks', async () => {
    github = {
      repos: {
        createStatus: jest.fn().mockReturnValue(Promise.resolve(true)),
      },
    };
    // Passes the mocked out GitHub API into out robot instance
    robot.auth = () => Promise.resolve(github);
    
    await robot.receive({
      event: 'status',
      payload: statusPendingNonBuildPayload,
    });
    
    // Should be a no-op
    const statusCalls = github.repos.createStatus.mock.calls;
    expect(github.repos.createStatus).not.toHaveBeenCalled();
  });
});
