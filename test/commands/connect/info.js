/* globals describe beforeEach afterEach it */

import cli from '@heroku/heroku-cli-util'
import nock from 'nock'
import expect from 'unexpected'
import ConnectInfo from '../../../commands/connect/info.js'
import { runCommand } from '../../run-command.js'

const password = 's3cr3t3'
const headers = {
  'content-type': 'application/json',
  authorization: `Bearer ${password}`,
  'heroku-client': 'cli'
}

describe('connect:info', () => {
  // prevent stdout/stderr from displaying
  // redirects to cli.stdout/cli.stderr instead
  beforeEach(() => {
    cli.mockConsole()
    process.env.HEROKU_API_KEY = password
  })

  afterEach(() => {
    delete process.env.HEROKU_API_KEY
  })

  it('retrieves info about connection, given an app name and resource name', async () => {
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

    const connectionDetailApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/connections/1234')
      .query({ deep: true })
      .reply(200, connectionData)

    await runCommand(ConnectInfo, ['--app', appName, '--resource', resourceName])

    expect(cli.stdout, 'to contain', connectionData.resource_name)
    expect(cli.stdout, 'to contain', connectionData.mappings[0].object_name)
    expect(cli.stdout, 'to contain', connectionData.mappings[0].state)
    expect(cli.stdout, 'to contain', connectionData.mappings[1].object_name)
    expect(cli.stdout, 'to contain', connectionData.mappings[1].state)
    expect(cli.stderr, 'to be empty')
    discoveryApi.done()
    connectionDetailApi.done()
  })

  it('returns an error message if no connections are found', async () => {
    const appName = 'fake-app'
    const resourceName = 'abcd-ef01'
    const check = nock('https://hc-central-qa.herokai.com/', { headers })
      .post('/auth/fake-app')
      .reply(200, { results: [] })
    const discoveryApi = nock('https://hc-central-qa.herokai.com/', { headers })
      .get('/connections')
      .query({ app: appName, resource_name: resourceName })
      .reply(200, { results: [] })
    const discoveryApi2 = nock('https://hc-central-qa.herokai.com/', { headers })
      .get('/connections')
      .query({ app: appName, resource_name: resourceName })
      .reply(200, { results: [] })

    await runCommand(ConnectInfo, ['--app', appName, '--resource', resourceName])

    expect(cli.stdout, 'to be empty')
    expect(cli.stderr, 'to contain', 'No connection found')
    expect(cli.stderr, 'to contain', 'heroku addons:open connectqa -a fake-app')
    discoveryApi.done()
    discoveryApi2.done()
    check.done()
  })
})
