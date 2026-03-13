/* globals describe beforeEach afterEach it */

import cli from '@heroku/heroku-cli-util'
import nock from 'nock'
import expect from 'unexpected'
import sinon from 'sinon'
import SfAuth from '../../../commands/connect/sf/auth.js'
import { runCommand } from '../../run-command.js'

const password = 's3cr3t3'
const headers = {
  'content-type': 'application/json',
  authorization: `Bearer ${password}`,
  'heroku-client': 'cli'
}

describe('connect:sf:auth', () => {
  beforeEach(function () {
    // prevent stdout/stderr from displaying
    // redirects to cli.stdout/cli.stderr instead
    cli.mockConsole()
    process.env.HEROKU_API_KEY = password
    // Stub out the callbackServer we create for SF Authentication
    sinon.stub(SfAuth, 'callbackServer').resolves(true)
    // Stub out the helper to open a URL in a browser
    sinon.stub(cli, 'open').resolves(true)
  })

  afterEach(function () {
    delete process.env.HEROKU_API_KEY
    sinon.restore()
  })

  it('authenticates the user to Salesforce', async () => {
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

    await runCommand(SfAuth, ['--app', appName, '--resource', resourceName])

    expect(cli.stdout, 'to contain', "If your browser doesn't open")
    discoveryApi.done()
    connectionDetailApi.done()
    apiWithoutPort.done()
  })
})
