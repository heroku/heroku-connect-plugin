import {runCommand} from '@heroku-cli/test-utils'
import nock from 'nock'
import {
  afterEach, beforeEach, describe, expect, it,
} from 'vitest'

import ConnectDiagnose from '../../../src/commands/connect/diagnose.js'

const password = 's3cr3t3'
const headers = {
  authorization: `Bearer ${password}`,
  'content-type': 'application/json',
  'heroku-client': 'cli',
}

describe('connect:diagnose', () => {
  beforeEach(() => {
    process.env.HEROKU_API_KEY = password
  })

  afterEach(() => {
    delete process.env.HEROKU_API_KEY
  })

  it('runs validations with polling', async () => {
    const appName = 'fake-app'

    const discoveryApi = nock('https://hc-central-qa.herokai.com/', {reqheaders: headers})
      .get('/connections')
      .query({app: appName})
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
      name: 'awesome-connection-1234',
      region_url: 'https://hc-virginia-qa.herokai.com/',
      schema_name: 'salesforce',
      state: 'IDLE',
    }

    const connectionDetailApi = nock('https://hc-virginia-qa.herokai.com/', {reqheaders: headers})
      .get('/connections/1234')
      .query({deep: true})
      .reply(200, connectionData)

    const connectionValidationApi = nock('https://hc-virginia-qa.herokai.com/', {reqheaders: headers})
      .post('/api/v3/connections/1234/validations')
      .reply(202, {
        result_url: 'https://hc-virginia-qa.herokai.com/api/v3/connections/1234/validations/456',
      })
      .get('/api/v3/connections/1234/validations/456')
      .twice()
      .reply(202)
      .get('/api/v3/connections/1234/validations/456')
      .reply(200, {
        errors: [],
        passes: [],
        skips: [],
        warnings: [
          {
            display_name: 'Salesforce API Version',
            doc_url:
              'https://devcenter.heroku.com/articles/heroku-connect-diagnose#check-salesforce-api-version',
            message:
              'The latest available Salesforce API version is 47.0. Your connection is using version 44.0. You should re-create your connection to use the latest version.',
            rule_id: 'MUST_USE_RECENT_API_VERSION',
            status: 'FAILED',
          },
          {
            display_name: 'Configured Logging',
            doc_url:
              'https://devcenter.heroku.com/articles/heroku-connect-diagnose#check-configured-log-drain',
            message: 'App does not have logging configured.',
            rule_id: 'SHOULD_HAVE_LOG_DRAIN',
            status: 'FAILED',
          },
        ],
      })

    const {stdout} = await runCommand(ConnectDiagnose, ['--app', appName])

    expect(stdout).toContain('Salesforce API Version')
    expect(stdout).toContain('The latest available Salesforce API version is 47.0. Your connection is using version 44.0. You should re-create your connection to use the latest version.')
    expect(stdout).toContain('Configured Logging')
    expect(stdout).toContain('App does not have logging configured.')
    discoveryApi.done()
    connectionDetailApi.done()
    connectionValidationApi.done()
  })
})
