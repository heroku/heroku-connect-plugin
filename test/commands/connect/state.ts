import {runCommand} from '@heroku-cli/test-utils'
import nock from 'nock'
import {
  afterEach, beforeEach, describe, expect, it,
} from 'vitest'

import ConnectState from '../../../src/commands/connect/state.js'

const password = 's3cr3t3'
const headers = {
  authorization: `Bearer ${password}`,
  'content-type': 'application/json',
  'heroku-client': 'cli',
}

describe('connect:state', () => {
  beforeEach(() => {
    process.env.HEROKU_API_KEY = password
  })

  afterEach(() => {
    delete process.env.HEROKU_API_KEY
  })

  it('retrieves the state of the connect addon and prints a table', async () => {
    const appName = 'fake-app'
    const resourceName = 'abcd-ef01'
    const discoveryApi = nock('https://hc-central-qa.herokai.com/', {reqheaders: headers})
      .get('/connections')
      .query({app: appName, resource_name: resourceName})
      .reply(200, {
        results: [
          {detail_url: 'https://hc-virginia-qa.herokai.com/connections/1234'},
        ],
      })

    const connectionData = {
      db_key: 'DATABASE_URL',
      id: 1234,
      schema_name: 'salesforce',
      state: 'IDLE',
    }

    const connectionDetailApi = nock('https://hc-virginia-qa.herokai.com/', {reqheaders: headers})
      .get('/connections/1234')
      .query({deep: true})
      .reply(200, connectionData)

    const {stderr, stdout} = await runCommand(ConnectState, ['--app', appName, '--resource', resourceName])

    expect(stdout).toContain('IDLE')
    expect(stdout).toContain('DATABASE_URL')
    expect(stdout).toContain('salesforce')
    expect(stderr).toBe('')
    discoveryApi.done()
    connectionDetailApi.done()
  })

  it('retrieves the state of the connect addon and outputs JSON if flag is passed', async () => {
    const appName = 'fake-app'
    const resourceName = 'abcd-ef01'
    const discoveryApi = nock('https://hc-central-qa.herokai.com/', {reqheaders: headers})
      .get('/connections')
      .query({app: appName, resource_name: resourceName})
      .reply(200, {
        results: [
          {detail_url: 'https://hc-virginia-qa.herokai.com/connections/1234'},
        ],
      })

    const connectionData = {
      db_key: 'DATABASE_URL',
      detail_url: 'https://hc-virginia-qa.herokai.com/connections/1234',
      id: 1234,
      schema_name: 'salesforce',
      state: 'IDLE',
    }

    const connectionDetailApi = nock('https://hc-virginia-qa.herokai.com/', {reqheaders: headers})
      .get('/connections/1234')
      .query({deep: true})
      .reply(200, connectionData)

    const {stderr, stdout} = await runCommand(ConnectState, ['--app', appName, '--resource', resourceName, '--json'])

    expect(JSON.parse(stdout)).toEqual([connectionData])
    expect(stderr).toBe('')
    discoveryApi.done()
    connectionDetailApi.done()
  })
})
