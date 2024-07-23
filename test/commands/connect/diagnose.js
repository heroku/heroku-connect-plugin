/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('unexpected')
const cmd = require('../../../commands/connect/diagnose')

const password = 's3cr3t3'
const headers = {
  'content-type': 'application/json',
  authorization: `Bearer ${password}`,
  'heroku-client': 'cli'
}

describe('connect:diagnose', () => {
  // prevent stdout/stderr from displaying
  // redirects to cli.stdout/cli.stderr instead
  beforeEach(() => cli.mockConsole())

  it('runs validations with polling', () => {
    const appName = 'fake-app'

    const discoveryApi = nock('https://hc-central-qa.herokai.com/', { headers })
      .get('/connections')
      .query({ app: appName })
      .reply(200, {
        results: [
          {
            detail_url: 'https://hc-virginia-qa.herokai.com/connections/1234'
          }
        ]
      })

    const connectionData = {
      id: 1234,
      name: 'awesome-connection-1234',
      db_key: 'DATABASE_URL',
      state: 'IDLE',
      schema_name: 'salesforce',
      region_url: 'https://hc-virginia-qa.herokai.com/'
    }

    const connectionDetailApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/connections/1234')
      .query({ deep: true })
      .reply(200, connectionData)

    const connectionValidationApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/validations')
      .reply(202, {
        result_url: 'https://hc-virginia-qa.herokai.com/api/v3/connections/1234/validations/456'
      })
      .get('/api/v3/connections/1234/validations/456')
      .twice()
      .reply(202)
      .get('/api/v3/connections/1234/validations/456')
      .reply(200, {
        passes: [],
        warnings: [
          {
            rule_id: 'MUST_USE_RECENT_API_VERSION',
            display_name: 'Salesforce API Version',
            status: 'FAILED',
            message:
                'The latest available Salesforce API version is 47.0. Your connection is using version 44.0. You should re-create your connection to use the latest version.',
            doc_url:
                'https://devcenter.heroku.com/articles/heroku-connect-diagnose#check-salesforce-api-version'
          },
          {
            rule_id: 'SHOULD_HAVE_LOG_DRAIN',
            display_name: 'Configured Logging',
            status: 'FAILED',
            message: 'App does not have logging configured.',
            doc_url:
                'https://devcenter.heroku.com/articles/heroku-connect-diagnose#check-configured-log-drain'
          }
        ],
        errors: [],
        skips: []
      })

    return cmd
      .run({
        app: appName,
        flags: {}
      })
      .then(() => {
        expect(
          cli.stdout,
          'to contain',
          `=== Connection: awesome-connection-1234
YELLOW: Salesforce API Version
The latest available Salesforce API version is 47.0. Your connection is using version 44.0. You should re-create your connection to use the latest version.
https://devcenter.heroku.com/articles/heroku-connect-diagnose#check-salesforce-api-version
YELLOW: Configured Logging
App does not have logging configured.
https://devcenter.heroku.com/articles/heroku-connect-diagnose#check-configured-log-drain
`
        )
      })
      .then(() => {
        discoveryApi.done()
        connectionDetailApi.done()
        connectionValidationApi.done()
      })
  })
})
