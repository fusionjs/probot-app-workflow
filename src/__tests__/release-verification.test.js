import {Application} from 'probot';
import app from '../release-verification';

import nonReleasePayload from './fixtures/non-release-payload.json';
import nonReleaseOpenedPayload from './fixtures/non-release-opened-payload.json';
import prereleasePayload from './fixtures/prerelease-payload.json';
import releasePayload from './fixtures/release-payload.json';
import nonReleaseClosedPayload from './fixtures/non-release-closed-payload.json';
import releaseClosedPayload from './fixtures/release-closed-payload.json';

jest.mock('node-fetch', () => {
  return () =>
    Promise.resolve({
      json: () => Promise.resolve({web_url: 'fusion-verification-url'}),
    });
});

describe('release-verification', () => {
  let robot;
  let github;

  beforeEach(() => {
    robot = new Application();
    robot.load(app);
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

  it('sets status to success for non-release payload', async () => {
    await robot.receive({
      event: 'pull_request',
      payload: nonReleaseOpenedPayload,
    });
    // Should immediately set success
    const statusCalls = github.repos.createStatus.mock.calls;
    expect(github.repos.createStatus).toHaveBeenCalled();
    expect(statusCalls.length).toBe(1);
    expect(statusCalls[0][0].state).toBe('success');
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

  it('on PR close for non-release: triggers buildkite', async () => {
    await robot.receive({
      event: 'pull_request',
      payload: nonReleaseClosedPayload,
    });
    expect(github.issues.createComment.mock.calls.length).toBe(1);
    expect(github.issues.createComment.mock.calls[0][0].body).toContain(
      'fusion-verification-url'
    );
    const statusCalls = github.repos.createStatus.mock.calls;
    expect(statusCalls.length).toBe(0);
  });

  it('on PR close for release: no-op', async () => {
    await robot.receive({
      event: 'pull_request',
      payload: releaseClosedPayload,
    });
    expect(github.issues.createComment.mock.calls.length).toBe(0);
    const statusCalls = github.repos.createStatus.mock.calls;
    expect(statusCalls.length).toBe(0);
  });
});
