import {createRobot} from 'probot';
import app from '../release-verification';

import nonReleasePayload from './fixtures/non-release-payload.json';
import prereleasePayload from './fixtures/prerelease-payload.json';
import releasePayload from './fixtures/release-payload.json';

jest.mock('child_process', () => {
  return {
    exec: (command, callback) => {
      callback(null, '{"web_url": "fusion-verification-url"}');
    },
  };
});

describe('release-verification', () => {
  let robot;
  let github;

  beforeEach(() => {
    robot = createRobot();
    app(robot);
    github = {
      issues: {
        createComment: jest.fn(),
      },
      repos: {
        createStatus: jest.fn().mockReturnValue(Promise.resolve(true)),
      },
    };
    // Passes the mocked out GitHub API into out robot instance
    robot.auth = () => Promise.resolve(github);
  });

  it('non-release tag applied', async () => {
    await robot.receive({
      event: 'pull_request',
      payload: nonReleasePayload,
    });
    // Should immediately set success
    const statusCalls = github.repos.createStatus.mock.calls;
    expect(github.repos.createStatus).toHaveBeenCalled();
    expect(github.issues.createComment.mock.calls.length).toBe(0);
    expect(statusCalls.length).toBe(2);
    expect(statusCalls[0][0].state).toBe('pending');
    expect(statusCalls[1][0].state).toBe('success');
  });

  it('triggers buildkite and sets status for prerelease', async () => {
    await robot.receive({
      event: 'pull_request',
      payload: prereleasePayload,
    });
    const statusCalls = github.repos.createStatus.mock.calls;
    expect(github.repos.createStatus).toHaveBeenCalled();
    expect(github.issues.createComment.mock.calls.length).toBe(1);
    expect(github.issues.createComment.mock.calls[0][0].body).toContain(
      'fusion-verification-url'
    );
    expect(statusCalls.length).toBe(2);
    expect(statusCalls[0][0].state).toBe('pending');
    expect(statusCalls[1][0].state).toBe('success');
  });

  it('triggers buildkite and sets status for release', async () => {
    await robot.receive({
      event: 'pull_request',
      payload: releasePayload,
    });
    const statusCalls = github.repos.createStatus.mock.calls;
    expect(github.repos.createStatus).toHaveBeenCalled();
    expect(github.issues.createComment.mock.calls.length).toBe(1);
    expect(github.issues.createComment.mock.calls[0][0].body).toContain(
      'fusion-verification-url'
    );
    expect(statusCalls.length).toBe(2);
    expect(statusCalls[0][0].state).toBe('pending');
    expect(statusCalls[1][0].state).toBe('pending');
  });
});
