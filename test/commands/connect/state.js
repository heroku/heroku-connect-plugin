/* globals describe beforeEach afterEach it */

import cli from '@heroku/heroku-cli-util'
import nock from 'nock'
import expect from 'unexpected'
import ConnectState from '../../../commands/connect/state.js'
import { runCommand } from '../../run-command.js'

const password = 's3cr3t3'
const headers = {
  'content-type': 'application/json',
  authorization: `Bearer ${password}`,
  'heroku-client': 'cli'
}

describe('connect:state', () => {
  // prevent stdout/stderr from displaying
  // redirects to cli.stdout/cli.stderr instead
  beforeEach(() => {
    cli.mockConsole()
    process.env.HEROKU_API_KEY = password
  })

  afterEach(() => {
    delete process.env.HEROKU_API_KEY
  })

  it('retrieves the state of the connect addon and prints a table', async () => {
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

    await runCommand(ConnectState, ['--app', appName, '--resource', resourceName])

    expect(cli.stdout, 'to contain', 'IDLE')
    expect(cli.stdout, 'to contain', 'DATABASE_URL')
    expect(cli.stdout, 'to contain', 'salesforce')
    expect(cli.stderr, 'to be empty')
    discoveryApi.done()
    connectionDetailApi.done()
  })

  it('retrieves the state of the connect addon and outputs JSON if flag is passed', async () => {
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

    await runCommand(ConnectState, ['--app', appName, '--resource', resourceName, '--json'])

    expect(JSON.parse(cli.stdout), 'to equal', [connectionData])
    expect(cli.stderr, 'to be empty')
    discoveryApi.done()
    connectionDetailApi.done()
  })
})
