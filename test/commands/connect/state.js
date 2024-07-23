'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('unexpected')
const stateCmd = require('../../../commands/connect/state')

const password = 's3cr3t3'
const headers = {
  'content-type': 'application/json',
  authorization: `Bearer ${password}`,
  'heroku-client': 'cli'
}

describe('connect:state', () => {
  // prevent stdout/stderr from displaying
  // redirects to cli.stdout/cli.stderr instead
  beforeEach(() => cli.mockConsole())

  it('retrieves the state of the connect addon and prints a table', () => {
    const appName = 'fake-app'
    const resourceName = 'abcd-ef01'
    const discoveryApi = nock('https://hc-central-qa.herokai.com/', { headers })
      .get('/connections')
      .query({ app: appName, resource_name: resourceName })
      .reply(200, {
        results: [
          {
            detail_url: 'https://hc-virginia-qa.herokai.com/connections/1234'
          }
        ]
      })

    const connectionData = {
      id: 1234,
      db_key: 'DATABASE_URL',
      state: 'IDLE',
      schema_name: 'salesforce'
    }

    const connectionDetailApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/connections/1234')
      .query({ deep: true })
      .reply(200, connectionData)

    return stateCmd.run({
      app: appName,
      flags: {
        resource: resourceName
      },
      auth: {
        password
      }
    }, {})
      .then(() => {
        expect(cli.stdout, 'to contain', 'IDLE')
        expect(cli.stdout, 'to contain', 'DATABASE_URL')
        expect(cli.stdout, 'to contain', 'salesforce')
      })
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => {
        discoveryApi.done()
        connectionDetailApi.done()
      })
  })

  it('retrieves the state of the connect addon and outputs JSON if flag is passed', () => {
    const appName = 'fake-app'
    const resourceName = 'abcd-ef01'
    const discoveryApi = nock('https://hc-central-qa.herokai.com/', { headers })
      .get('/connections')
      .query({ app: appName, resource_name: resourceName })
      .reply(200, {
        results: [
          {
            detail_url: 'https://hc-virginia-qa.herokai.com/connections/1234'
          }
        ]
      })

    const connectionData = {
      detail_url: 'https://hc-virginia-qa.herokai.com/connections/1234',
      id: 1234,
      db_key: 'DATABASE_URL',
      state: 'IDLE',
      schema_name: 'salesforce'
    }

    const connectionDetailApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/connections/1234')
      .query({ deep: true })
      .reply(200, connectionData)

    return stateCmd.run({
      app: appName,
      flags: {
        resource: resourceName,
        json: true
      },
      auth: {
        password
      }
    }, {})
      .then(() => {
        expect(JSON.parse(cli.stdout), 'to equal', [connectionData])
      })
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => {
        discoveryApi.done()
        connectionDetailApi.done()
      })
  })
})
