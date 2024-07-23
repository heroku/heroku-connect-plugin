'use strict'
/* globals describe beforeEach it */

const cli = require('@heroku/heroku-cli-util')
const nock = require('nock')
const expect = require('unexpected')
const sinon = require('sinon')
const sfAuthCmd = require('../../../commands/connect/sf-auth')

const password = 's3cr3t3'
const headers = {
  'content-type': 'application/json',
  authorization: `Bearer ${password}`,
  'heroku-client': 'cli'
}

describe('connect:sf:auth', () => {
  // prevent stdout/stderr from displaying
  // redirects to cli.stdout/cli.stderr instead
  beforeEach(() => cli.mockConsole())
  // Stub out the callbackServer we create for SF Authentication
  beforeEach(() => sinon.stub(sfAuthCmd, 'callbackServer').resolves(true))
  beforeEach(() => sinon.stub(cli, 'action').resolves(true))
  // Stub out the helper to open a URL in a browser
  beforeEach(() => sinon.stub(cli, 'open').resolves(true))

  it('authenticates the user to Salesforce', () => {
    const appName = 'fake-app'
    const resourceName = 'abcd-ef01'
    const connectionId = '1234'
    const discoveryApi = nock('https://hc-central-qa.herokai.com/', { headers })
      .get('/connections')
      .query({ app: appName, resource_name: resourceName })
      .reply(200, {
        results: [
          {
            detail_url: 'https://connect-us.heroku.com/connections/1234',
            region_url: 'https://connect-us.heroku.com',
            id: 1234
          }
        ]
      })

    const connectionData = {
      id: 1234,
      db_key: 'DATABASE_URL',
      state: 'IDLE',
      schema_name: 'salesforce'
    }

    const connectionDetailApi = nock('https://connect-us.heroku.com', { headers })
      .get('/connections/1234')
      .query({ deep: true })
      .reply(200, connectionData)

    const apiWithoutPort = nock('https://connect-us.heroku.com')
      .post('/api/v3/connections/' + connectionId + '/authorize_url', {
        environment: 'production',
        next: 'http://localhost:18000'
      })
      .reply(201, { redirect: 'redirect-uri' })

    return sfAuthCmd.run({
      app: appName,
      flags: {
        resource: resourceName
      },
      auth: {
        password: password
      }
    }, {})
      .then(() => expect(
        cli.stdout,
        'to equal',
        // NOTE(sigmavirus24): Determine why redir is undefined outside the
        // yield
        "\nIf your browser doesn't open, please copy the following URL to proceed:\nundefined\n\n"
      ))
      .then(() => discoveryApi.done() && connectionDetailApi.done() && apiWithoutPort.done())
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => expect(cli.action.called, 'to be true'))
  })
})
