import { runCommand } from '@heroku-cli/test-utils'
import nock from 'nock'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import ConnectSfApiUpgrade from '../../../commands/connect/sf-api-upgrade.js'

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

function stubDiff (targetVersion = '61.0', mappings = []) {
  return nock('https://hc-virginia-qa.herokai.com/', { headers })
    .get('/api/v3/connections/1234/schema-diff')
    .query({ target_version: targetVersion })
    .reply(200, {
      guid: '1234',
      current_api_version: '55.0',
      target_api_version: targetVersion,
      mappings
    })
}

describe('connect:sf-api-upgrade', () => {
  beforeEach(() => {
    process.env.HEROKU_API_KEY = password
  })

  afterEach(() => {
    delete process.env.HEROKU_API_KEY
    nock.cleanAll()
  })

  it('rejects an invalid --target-version before any network call', async () => {
    const { error } = await runCommand(ConnectSfApiUpgrade, [
      '--app', appName, '--connection', resourceName, '--target-version', 'not-a-version'
    ])
    expect(error).toBeDefined()
    expect(error.message).toContain('Invalid --target-version')
    expect(nock.pendingMocks()).toHaveLength(0)
  })

  it('normalizes an integer --target-version to NN.0', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = stubDiff('61.0')

    const { stdout } = await runCommand(ConnectSfApiUpgrade, ['--app', appName, '--connection', resourceName, '--target-version', '61'])

    expect(stdout).toContain('Target API Version:  61.0')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('rejects a sub-floor --target-version (e.g. 1.0)', async () => {
    const { error } = await runCommand(ConnectSfApiUpgrade, [
      '--app', appName, '--connection', resourceName, '--target-version', '1.0'
    ])
    expect(error).toBeDefined()
    expect(error.message).toContain('Invalid --target-version')
    expect(nock.pendingMocks()).toHaveLength(0)
  })

  it('renders the diff table without upgrading when --confirm is omitted', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = stubDiff('61.0', [
      { name: 'Account', result_message: 'ok', fields_have_changed: false },
      { name: 'Lead', result_message: 'changed', fields_have_changed: true }
    ])

    const { stdout } = await runCommand(ConnectSfApiUpgrade, ['--app', appName, '--connection', resourceName, '--target-version', '61.0'])

    expect(stdout).toContain('Current API Version: 55.0')
    expect(stdout).toContain('Target API Version:  61.0')
    expect(stdout).toContain('Account')
    expect(stdout).toContain('no changes')
    expect(stdout).not.toContain('Upgrade dispatched')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('renders unsafe-change styling when has_unsafe_changes is true', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = stubDiff('61.0', [
      { name: 'Account', result_message: 'unsafe change', fields_have_changed: true, has_unsafe_changes: true }
    ])

    const { stdout } = await runCommand(ConnectSfApiUpgrade, ['--app', appName, '--connection', resourceName, '--target-version', '61.0'])

    expect(stdout).toContain('changed (unsafe)')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('renders safe-change styling when has_unsafe_changes is false', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = stubDiff('61.0', [
      { name: 'Account', result_message: 'length increase', fields_have_changed: true, has_unsafe_changes: false }
    ])

    const { stdout } = await runCommand(ConnectSfApiUpgrade, ['--app', appName, '--connection', resourceName, '--target-version', '61.0'])

    expect(stdout).toContain('changed (safe)')
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
      mappings: [{ name: 'Account', result_message: 'ok', fields_have_changed: false }]
    }
    const diffApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/api/v3/connections/1234/schema-diff')
      .query({ target_version: '61.0' })
      .reply(200, responseBody)

    const { stdout } = await runCommand(ConnectSfApiUpgrade, ['--app', appName, '--connection', resourceName, '--target-version', '61.0', '--json'])

    expect(JSON.parse(stdout)).toEqual(responseBody)
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('shows the diff then upgrades when --confirm matches the connection name', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = stubDiff('61.0', [{ name: 'Account', result_message: 'ok', fields_have_changed: false }])
    const upgradeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/actions/upgrade-api-version', { target_version: '61.0' })
      .reply(202, { target_version: '61.0' })

    const { stdout } = await runCommand(ConnectSfApiUpgrade, [
      '--app', appName, '--connection', resourceName,
      '--target-version', '61.0', '--confirm', baseConnection.name
    ])

    expect(stdout).toContain('Current API Version: 55.0')
    expect(stdout).toContain('Upgrade dispatched')
    expect(stdout).toContain('61.0')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
    upgradeApi.done()
  })

  it('accepts --confirm with surrounding whitespace', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = stubDiff('61.0')
    const upgradeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/actions/upgrade-api-version', { target_version: '61.0' })
      .reply(202, { target_version: '61.0' })

    const { stdout } = await runCommand(ConnectSfApiUpgrade, [
      '--app', appName, '--connection', resourceName,
      '--target-version', '61.0', '--confirm', `  ${baseConnection.name}  `
    ])

    expect(stdout).toContain('Upgrade dispatched')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
    upgradeApi.done()
  })

  it('aborts upgrade when --confirm does not match connection name', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = stubDiff('61.0')

    const { error } = await runCommand(ConnectSfApiUpgrade, [
      '--app', appName, '--connection', resourceName,
      '--target-version', '61.0', '--confirm', 'wrong-name'
    ])

    expect(error).toBeDefined()
    expect(error.message).toContain('does not match')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('displays backend error message when upgrade returns a non-2xx response', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = stubDiff('61.0')
    const upgradeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/actions/upgrade-api-version', { target_version: '61.0' })
      .reply(409, { message: 'Some mappings have unsafe changes. Edit them and retry.' })

    const { error } = await runCommand(ConnectSfApiUpgrade, [
      '--app', appName, '--connection', resourceName,
      '--target-version', '61.0', '--confirm', baseConnection.name
    ])

    expect(error).toBeDefined()
    expect(error.message).toContain('Some mappings have unsafe changes')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
    upgradeApi.done()
  })

  it('falls back to the requested target_version when backend response omits it', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = stubDiff('61.0')
    const upgradeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/actions/upgrade-api-version', { target_version: '61.0' })
      .reply(202, '')

    const { stdout } = await runCommand(ConnectSfApiUpgrade, [
      '--app', appName, '--connection', resourceName,
      '--target-version', '61.0', '--confirm', baseConnection.name
    ])

    expect(stdout).toContain('Upgrade dispatched')
    expect(stdout).toContain('61.0')
    expect(stdout).not.toContain('undefined')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
    upgradeApi.done()
  })
})
