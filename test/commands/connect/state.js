'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('unexpected')
const stateCmd = require('../../../commands/connect/state')

const axios = require('axios')
const httpAdapter = require('axios/lib/adapters/http')
const host = 'http://localhost:80'

axios.defaults.host = host
axios.defaults.adapter = httpAdapter

const password = 's3cr3t3'
const headers = {
  'content-type': 'application/json',
  'authorization': `Bearer ${password}`,
  'heroku-client': 'cli'
}

describe('connect:state', () => {
  // prevent stdout/stderr from displaying
  // redirects to cli.stdout/cli.stderr instead
  beforeEach(() => cli.mockConsole())

  it('retrieves the state of the connect addon and prints a table', () => {
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
      db_key: 'DATABASE_URL',
      state: 'IDLE',
      schema_name: 'salesforce'
    }

    let connectionDetailApi = nock('https://hc-virginia-qa.herokai.com/', {headers})
      .get('/connections/1234')
      .query({deep: true})
      .reply(200, connectionData)

    return stateCmd.run({
      app: appName,
      flags: {
        resource: resourceName,
        region: 'us'
      },
      auth: {
        password
      }
    }, {})
      .then(() => {
        expect(cli.stdout, 'to contain', `IDLE`)
        expect(cli.stdout, 'to contain', `DATABASE_URL`)
        expect(cli.stdout, 'to contain', `salesforce`)
      })
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => {
        discoveryApi.done()
        connectionDetailApi.done()
      })
  })

  it('retrieves the state of the connect addon and outputs JSON if flag is passed', () => {
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
      db_key: 'DATABASE_URL',
      state: 'IDLE',
      schema_name: 'salesforce'
    }

    let connectionDetailApi = nock('https://hc-virginia-qa.herokai.com/', {headers})
      .get('/connections/1234')
      .query({deep: true})
      .reply(200, connectionData)

    return stateCmd.run({
      app: appName,
      flags: {
        resource: resourceName,
        json: true,
        region: 'us'
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
