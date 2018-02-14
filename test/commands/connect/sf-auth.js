'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('unexpected')
const sinon = require('sinon')
const sfAuthCmd = require('../../../commands/connect/sf-auth')

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
    let appName = 'fake-app'
    let resourceName = 'abcd-ef01'
    let connectionId = '123'
    let password = 's3cr3t3'
    let apiWithPort = nock('https://connect-us.heroku.com:443')
      .get('/api/v3/connections')
      .query({deep: true, app: appName, resource_name: resourceName})
      .reply(200, {results: [{id: connectionId}]})
    let apiWithoutPort = nock('https://connect-us.heroku.com')
      .post('/api/v3/connections/' + connectionId + '/authorize_url', {
        environment: 'production',
        next: 'http://localhost:18000'
      })
      .reply(201, {redirect: 'redirect-uri'})

    return sfAuthCmd.run({
      app: appName,
      flags: {
        resource: resourceName,
        login: undefined,
        region: 'us'
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
      .then(() => apiWithPort.done() && apiWithoutPort.done())
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => expect(cli.action.called, 'to be true'))
  })
})
