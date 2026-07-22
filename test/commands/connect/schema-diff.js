/* globals describe beforeEach afterEach it */

import cli from '@heroku/heroku-cli-util'
import nock from 'nock'
import expect from 'unexpected'
import ConnectSchemaDiff from '../../../commands/connect/schema-diff.js'
import { runCommand } from '../../run-command.js'

const password = 's3cr3t3'
const headers = {
  'content-type': 'application/json',
  authorization: `Bearer ${password}`,
  'heroku-client': 'cli'
}

const appName = 'fake-app'
const resourceName = 'abcd-ef01'

const connectionDetailUrl = 'https://hc-virginia-qa.herokai.com/connections/1234'

const baseConnection = {
  id: 1234,
  name: 'fake-app:fake-conn',
  region_url: 'https://hc-virginia-qa.herokai.com/',
  state: 'PAUSED',
  api_version: '55.0'
}

function stubDiscovery () {
  return nock('https://hc-central-qa.herokai.com/', { headers })
    .get('/connections')
    .query({ app: appName, resource_name: resourceName })
    .reply(200, { results: [{ detail_url: connectionDetailUrl }] })
}

function stubConnectionDetail (extra = {}) {
  return nock('https://hc-virginia-qa.herokai.com/', { headers })
    .get('/connections/1234')
    .query({ deep: true })
    .reply(200, { ...baseConnection, ...extra })
}

describe('connect:schema-diff', () => {
  beforeEach(() => {
    cli.mockConsole()
    process.env.HEROKU_API_KEY = password
  })

  afterEach(() => {
    delete process.env.HEROKU_API_KEY
    nock.cleanAll()
  })

  it('renders a table comparing current and target API versions', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/api/v3/connections/1234/schema-diff')
      .reply(200, {
        guid: '1234',
        current_api_version: '55.0',
        target_api_version: '61.0',
        mappings: [
          { name: 'Account', result_message: 'Salesforce field definitions have not changed.', fields_have_changed: false },
          { name: 'Lead', result_message: 'Definitions have changed in Salesforce for field: name.', fields_have_changed: true }
        ]
      })

    await runCommand(ConnectSchemaDiff, ['--app', appName, '--resource', resourceName])

    expect(cli.stdout, 'to contain', 'Current API Version: 55.0')
    expect(cli.stdout, 'to contain', 'Target API Version:  61.0')
    expect(cli.stdout, 'to contain', 'Account')
    expect(cli.stdout, 'to contain', 'no changes')
    expect(cli.stdout, 'to contain', 'Lead')
    // The Lead row falls through to the bare 'changed' label because
    // has_unsafe_changes is missing — assert we did NOT mis-render it as
    // safe/unsafe/no-changes (the original assertion would have passed
    // even if status logic was completely broken).
    expect(cli.stdout, 'not to contain', '(safe)')
    expect(cli.stdout, 'not to contain', '(unsafe)')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('passes target_version to the API when --target-version is provided', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/api/v3/connections/1234/schema-diff')
      .query({ target_version: '60.0' })
      .reply(200, {
        guid: '1234',
        current_api_version: '55.0',
        target_api_version: '60.0',
        mappings: []
      })

    await runCommand(ConnectSchemaDiff, ['--app', appName, '--resource', resourceName, '--target-version', '60.0'])

    expect(cli.stdout, 'to contain', 'Target API Version:  60.0')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('outputs JSON when --json is passed', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const responseBody = {
      guid: '1234',
      current_api_version: '55.0',
      target_api_version: '61.0',
      mappings: [
        { name: 'Account', result_message: 'ok', fields_have_changed: false }
      ]
    }
    const diffApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/api/v3/connections/1234/schema-diff')
      .reply(200, responseBody)

    await runCommand(ConnectSchemaDiff, ['--app', appName, '--resource', resourceName, '--json'])

    expect(JSON.parse(cli.stdout), 'to equal', responseBody)
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('rejects an invalid --target-version before any network call', async () => {
    // Validation runs before withConnection, so neither the discovery nor
    // the connection-detail nocks should be consumed. Set them up only to
    // assert they remain pending.
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()

    let caught
    try {
      await runCommand(ConnectSchemaDiff, ['--app', appName, '--resource', resourceName, '--target-version', 'not-a-version'])
    } catch (err) {
      caught = err
    }

    expect(caught, 'to be defined')
    expect(caught.message, 'to contain', 'Invalid --target-version')
    expect(nock.pendingMocks(), 'not to be empty')
    expect(discoveryApi.isDone(), 'to be false')
    expect(connectionApi.isDone(), 'to be false')
    nock.cleanAll()
  })

  it('rejects a sub-floor --target-version even though the regex shape matches', async () => {
    let caught
    try {
      await runCommand(ConnectSchemaDiff, ['--app', appName, '--resource', resourceName, '--target-version', '1.0'])
    } catch (err) {
      caught = err
    }
    expect(caught, 'to be defined')
    expect(caught.message, 'to contain', 'Invalid --target-version')
  })

  it('renders unsafe-change styling when has_unsafe_changes is true', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/api/v3/connections/1234/schema-diff')
      .reply(200, {
        guid: '1234',
        current_api_version: '55.0',
        target_api_version: '61.0',
        mappings: [
          { name: 'Account', result_message: 'unsafe change', fields_have_changed: true, has_unsafe_changes: true }
        ]
      })

    await runCommand(ConnectSchemaDiff, ['--app', appName, '--resource', resourceName])

    expect(cli.stdout, 'to contain', 'changed (unsafe)')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('renders safe-change styling when has_unsafe_changes is false', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/api/v3/connections/1234/schema-diff')
      .reply(200, {
        guid: '1234',
        current_api_version: '55.0',
        target_api_version: '61.0',
        mappings: [
          { name: 'Account', result_message: 'length increase', fields_have_changed: true, has_unsafe_changes: false }
        ]
      })

    await runCommand(ConnectSchemaDiff, ['--app', appName, '--resource', resourceName])

    expect(cli.stdout, 'to contain', 'changed (safe)')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('does not crash when the backend returns no mappings field', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/api/v3/connections/1234/schema-diff')
      .reply(200, { guid: '1234', current_api_version: '55.0', target_api_version: '61.0' })

    await runCommand(ConnectSchemaDiff, ['--app', appName, '--resource', resourceName])

    expect(cli.stdout, 'to contain', 'Current API Version: 55.0')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })
})
