import {Application} from 'probot';
import app from '../release-verification';

import releasePayload from './fixtures/release-payload.json';

jest.mock('node-fetch', () => {
  return jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({web_url: 'fusion-verification-url'}),
    })
  );
});

const mockedFetch = require('node-fetch');

describe('buildkite meta-data', () => {
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

  it('populates meta-data with branch information', async () => {
    await robot.receive({
      event: 'pull_request',
      payload: releasePayload,
    });
    const jsonData = mockedFetch.mock.calls[0][1].body;
    expect(jsonData).toMatchSnapshot();
  });
});
