'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('unexpected')
const infoCmd = require('../../../commands/connect/info')

const password = 's3cr3t3'
const headers = {
  'content-type': 'application/json',
  'authorization': `Bearer ${password}`,
  'heroku-client': 'cli'
}

describe('connect:info', () => {
  // prevent stdout/stderr from displaying
  // redirects to cli.stdout/cli.stderr instead
  beforeEach(() => cli.mockConsole())

  it('retrieves info about connection, given an app name and resource name', () => {
    let appName = 'fake-app'
    let resourceName = 'abcd-ef01'
    let discoveryApi = nock('https://hc-central-qa.herokai.com/', {headers})
      .get('/connections')
      .query({app: appName, resource_name: resourceName})
      .reply(200, {results: [
        {
          detail_url: 'https://hc-virginia-qa.herokai.com/connections/1234'
        }
      ]})

    const connectionData = {
      id: 1234,
      resource_name: 'connectqa-chocolate-12345',
      db_key: 'DATABASE_URL',
      state: 'IDLE',
      schema_name: 'salesforce',
      mappings: [
        {
          id: '4567',
          state: 'UNAUTHORIZED',
          object_name: 'Account'
        },
        {
          id: '9912',
          state: 'SYNCED',
          object_name: 'Profile'
        }
      ]
    }

    let connectionDetailApi = nock('https://hc-virginia-qa.herokai.com/', {headers})
      .get('/connections/1234')
      .query({deep: true})
      .reply(200, connectionData)

    return infoCmd.run({
      app: appName,
      flags: {
        resource: resourceName
      },
      auth: {
        password
      }
    }, {})
      .then(() => {
        expect(cli.stdout, 'to contain', connectionData.resource_name)
        expect(cli.stdout, 'to contain', connectionData.mappings[0].object_name)
        expect(cli.stdout, 'to contain', connectionData.mappings[0].state)
        expect(cli.stdout, 'to contain', connectionData.mappings[1].object_name)
        expect(cli.stdout, 'to contain', connectionData.mappings[1].state)
      })
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => {
        discoveryApi.done()
        connectionDetailApi.done()
      })
  })

  it('returns an error message if no connections are found', () => {
    let appName = 'fake-app'
    let resourceName = 'abcd-ef01'
    let discoveryApi = nock('https://hc-central-qa.herokai.com/', {headers})
      .get('/connections')
      .query({app: appName, resource_name: resourceName})
      .reply(200, {results: []})

    return infoCmd.run({
      app: appName,
      flags: {
        resource: resourceName
      },
      auth: {
        password
      }
    }, {})
      .then(() => {
        expect(cli.stdout, 'to be empty')
      })
      .then(() => expect(cli.stderr, 'to contain', 'No connection found'))
      .then(() => expect(cli.stderr, 'to contain', `heroku addons:open connectqa -a fake-app`))
      .then(() => discoveryApi.done())
  })
})
