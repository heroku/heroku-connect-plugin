import {runCommand} from '@heroku-cli/test-utils'
import nock from 'nock'
import {
  afterEach, beforeEach, describe, expect, it,
} from 'vitest'

import ConnectInfo from '../../../src/commands/connect/info.js'

const password = 's3cr3t3'
const headers = {
  authorization: `Bearer ${password}`,
  'content-type': 'application/json',
  'heroku-client': 'cli',
}

describe('connect:info', () => {
  beforeEach(() => {
    process.env.HEROKU_API_KEY = password
  })

  afterEach(() => {
    delete process.env.HEROKU_API_KEY
  })

  it('retrieves info about connection, given an app name and resource name', async () => {
    const appName = 'fake-app'
    const resourceName = 'abcd-ef01'
    const discoveryApi = nock('https://hc-central-qa.herokai.com/', {reqheaders: headers})
      .get('/connections')
      .query({app: appName, resource_name: resourceName})
      .reply(200, {
        results: [
          {
            detail_url: 'https://hc-virginia-qa.herokai.com/connections/1234',
          },
        ],
      })

    const connectionData = {
      db_key: 'DATABASE_URL',
      id: 1234,
      mappings: [
        {
          id: '4567',
          object_name: 'Account',
          state: 'UNAUTHORIZED',
        },
        {
          id: '9912',
          object_name: 'Profile',
          state: 'SYNCED',
        },
      ],
      resource_name: 'connectqa-chocolate-12345',
      schema_name: 'salesforce',
      state: 'IDLE',
    }

    const connectionDetailApi = nock('https://hc-virginia-qa.herokai.com/', {reqheaders: headers})
      .get('/connections/1234')
      .query({deep: true})
      .reply(200, connectionData)

    const {stderr, stdout} = await runCommand(ConnectInfo, ['--app', appName, '--resource', resourceName])

    expect(stdout).toContain(connectionData.resource_name)
    expect(stdout).toContain(connectionData.mappings[0].object_name)
    expect(stdout).toContain(connectionData.mappings[0].state)
    expect(stdout).toContain(connectionData.mappings[1].object_name)
    expect(stdout).toContain(connectionData.mappings[1].state)
    expect(stderr).toBe('')
    discoveryApi.done()
    connectionDetailApi.done()
  })

  it('returns an error message if no connections are found', async () => {
    const appName = 'fake-app'
    const resourceName = 'abcd-ef01'
    const check = nock('https://hc-central-qa.herokai.com/', {reqheaders: headers})
      .post('/auth/fake-app')
      .reply(200, {results: []})
    const discoveryApi = nock('https://hc-central-qa.herokai.com/', {reqheaders: headers})
      .get('/connections')
      .query({app: appName, resource_name: resourceName})
      .reply(200, {results: []})
    const discoveryApi2 = nock('https://hc-central-qa.herokai.com/', {reqheaders: headers})
      .get('/connections')
      .query({app: appName, resource_name: resourceName})
      .reply(200, {results: []})

    const {stderr, stdout} = await runCommand(ConnectInfo, ['--app', appName, '--resource', resourceName])

    expect(stdout).toBe('')
    expect(stderr).toContain('No connection found')
    expect(stderr).toContain('heroku addons:open connectqa -a fake-app')
    discoveryApi.done()
    discoveryApi2.done()
    check.done()
  })
})
