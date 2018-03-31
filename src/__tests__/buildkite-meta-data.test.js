import {createRobot} from 'probot';
import app from '../release-verification';

import releasePayload from './fixtures/release-payload.json';

jest.mock('child_process', () => {
  return {
    exec: jest.fn(),
  };
});

const mockedExec = require('child_process').exec;

describe('buildkite meta-data', () => {
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

  it('populates meta-data with branch information', async () => {
    await robot.receive({
      event: 'pull_request',
      payload: releasePayload,
    });
    const jsonData = JSON.parse(
      mockedExec.mock.calls[0][0].match(/\-d\ \'([^']*)'/)[1]
    );
    expect(jsonData).toMatchSnapshot();
  });
});
