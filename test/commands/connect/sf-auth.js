import { runCommand } from '@heroku-cli/test-utils'
import cli from '@heroku/heroku-cli-util'
import nock from 'nock'
import sinon from 'sinon'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import SfAuth from '../../../commands/connect/sf/auth.js'

const password = 's3cr3t3'
const headers = {
  'content-type': 'application/json',
  authorization: `Bearer ${password}`,
  'heroku-client': 'cli'
}

describe('connect:sf:auth', () => {
  beforeEach(() => {
    process.env.HEROKU_API_KEY = password
    sinon.stub(SfAuth, 'callbackServer').resolves(true)
    sinon.stub(cli, 'open').resolves(true)
  })

  afterEach(() => {
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

    const { stdout } = await runCommand(SfAuth, ['--app', appName, '--resource', resourceName])

    expect(stdout).toContain("If your browser doesn't open")
    discoveryApi.done()
    connectionDetailApi.done()
    apiWithoutPort.done()
  })
})
