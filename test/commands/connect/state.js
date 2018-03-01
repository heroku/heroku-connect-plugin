'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('unexpected')
const stateCmd = require('../../../commands/connect/state')

describe('connect:state', () => {
  // prevent stdout/stderr from displaying
  // redirects to cli.stdout/cli.stderr instead
  beforeEach(() => cli.mockConsole())

  it('retrieves the state of the connect addon', () => {
    let appName = 'fake-app'
    let resourceName = 'abcd-ef01'
    let password = 's3cr3t3'
    let api = nock('https://connect-us.heroku.com:443', {
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${password}`,
        'heroku-client': 'cli'
      }
    })
      .get('/api/v3/connections')
      .query({deep: true, app: appName, resource_name: resourceName})
      .reply(200, {results: [{state: 'NEW'}]})

    return stateCmd.run({
      app: appName,
      flags: {
        resource: resourceName,
        region: 'us'
      },
      auth: {
        password: password
      }
    }, {})
      .then(() => expect(cli.stdout, 'to equal', 'NEW\n'))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })
})
