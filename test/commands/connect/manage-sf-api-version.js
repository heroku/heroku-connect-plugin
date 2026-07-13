import { runCommand } from '@heroku-cli/test-utils'
import nock from 'nock'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import ConnectManageSfApiVersion from '../../../commands/connect/manage-sf-api-version.js'

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

// Two endpoints: the GET schema-diff preview and the POST change action.
// Both return the diff payload; the change action also echoes target_version.
function stubUpgrade ({ confirm = false, targetVersion = '61.0', mappings = [], statusCode = null, body = null } = {}) {
  const responseStatus = statusCode || (confirm ? 202 : 200)
  const responseBody = body || {
    guid: '1234',
    current_api_version: '55.0',
    target_api_version: targetVersion,
    mappings,
    ...(confirm ? { target_version: targetVersion } : {})
  }
  const scope = nock('https://hc-virginia-qa.herokai.com/', { headers })
  return confirm
    ? scope
      .post('/api/v3/connections/1234/actions/change-sf-api-version', { target_version: targetVersion })
      .reply(responseStatus, responseBody)
    : scope
      .get('/api/v3/connections/1234/schema-diff')
      .query({ target_version: targetVersion })
      .reply(responseStatus, responseBody)
}

describe('connect:manage-sf-api-version', () => {
  beforeEach(() => {
    process.env.HEROKU_API_KEY = password
  })

  afterEach(() => {
    delete process.env.HEROKU_API_KEY
    nock.cleanAll()
  })

  it('rejects a non-numeric --target-version before any network call', async () => {
    const { error } = await runCommand(ConnectManageSfApiVersion, [
      '--app', appName, '--connection', resourceName, '--target-version', 'not-a-version'
    ])
    expect(error).toBeDefined()
    expect(error.message).toContain('--target-version "not-a-version" is invalid')
    expect(nock.pendingMocks()).toHaveLength(0)
  })

  it('emits a structured JSON error for an invalid --target-version when --json is passed', async () => {
    const { stdout } = await runCommand(ConnectManageSfApiVersion, [
      '--app', appName, '--connection', resourceName, '--target-version', 'not-a-version', '--json'
    ])
    const parsed = JSON.parse(stdout)
    expect(parsed.error).toContain('--target-version "not-a-version" is invalid')
    expect(nock.pendingMocks()).toHaveLength(0)
  })

  it('emits a structured JSON error for a --confirm mismatch when --json is passed', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()

    const { stdout } = await runCommand(ConnectManageSfApiVersion, [
      '--app', appName, '--connection', resourceName,
      '--target-version', '61.0', '--confirm', 'wrong-name', '--json'
    ])

    const parsed = JSON.parse(stdout)
    expect(parsed.error).toContain('doesn’t match')
    expect(nock.pendingMocks()).toHaveLength(0)
    discoveryApi.done()
    connectionApi.done()
  })

  it('emits a structured JSON error when the backend fails and --json is passed', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = stubUpgrade({
      confirm: true,
      targetVersion: '61.0',
      statusCode: 409,
      body: { message: 'Some mappings have unsafe changes. Edit them and retry.' }
    })

    const { stdout } = await runCommand(ConnectManageSfApiVersion, [
      '--app', appName, '--connection', resourceName,
      '--target-version', '61.0', '--confirm', appName, '--json'
    ])

    const parsed = JSON.parse(stdout)
    expect(parsed.error).toContain('Some mappings have unsafe changes')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('normalizes an integer --target-version to NN.0', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = stubUpgrade({ targetVersion: '61.0' })

    const { stdout } = await runCommand(ConnectManageSfApiVersion, ['--app', appName, '--connection', resourceName, '--target-version', '61'])

    expect(stdout).toContain('Target API Version:  61.0')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('renders the diff table without upgrading when --confirm is omitted', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = stubUpgrade({
      targetVersion: '61.0',
      mappings: [
        { name: 'Account', result_message: 'UNCHANGED_DETAILS', fields_have_changed: false },
        { name: 'Lead', result_message: 'CHANGED_DETAILS', fields_have_changed: true }
      ]
    })

    const { stdout } = await runCommand(ConnectManageSfApiVersion, ['--app', appName, '--connection', resourceName, '--target-version', '61.0'])

    expect(stdout).toContain('Current API Version: 55.0')
    expect(stdout).toContain('Target API Version:  61.0')
    expect(stdout).toContain('Account')
    expect(stdout).toContain('No action required')
    // The changed row shows its details; the no-change row's details is blank.
    expect(stdout).toContain('CHANGED_DETAILS')
    expect(stdout).not.toContain('UNCHANGED_DETAILS')
    expect(stdout).toContain('re-run this command with --confirm')
    expect(stdout).not.toContain('Upgrade dispatched')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('shows "Action required" for an unsafe change and "No action required" otherwise', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = stubUpgrade({
      targetVersion: '61.0',
      mappings: [
        { name: 'Account', result_message: 'length increase', fields_have_changed: true, has_unsafe_changes: false },
        { name: 'Contact', result_message: 'field removed', fields_have_changed: true, has_unsafe_changes: true }
      ]
    })

    const { stdout } = await runCommand(ConnectManageSfApiVersion, ['--app', appName, '--connection', resourceName, '--target-version', '61.0'])

    // Status is framed by required action, not by "safe"/"unsafe".
    expect(stdout).toContain('Action required')
    expect(stdout).toContain('No action required')
    expect(stdout).not.toContain('(safe)')
    expect(stdout).not.toContain('(unsafe)')
    // Action-required rows sort first even though the backend returned the
    // safe (Account) row before the unsafe (Contact) one.
    expect(stdout.indexOf('Contact')).toBeLessThan(stdout.indexOf('Account'))
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('orders rows unsafe, then safe changes, then no changes', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    // Backend returns them in the reverse of the desired display order.
    const diffApi = stubUpgrade({
      targetVersion: '61.0',
      mappings: [
        { name: 'Opportunity', result_message: 'no changes', fields_have_changed: false, has_unsafe_changes: false },
        { name: 'Account', result_message: 'length increase', fields_have_changed: true, has_unsafe_changes: false },
        { name: 'Contact', result_message: 'field removed', fields_have_changed: true, has_unsafe_changes: true }
      ]
    })

    const { stdout } = await runCommand(ConnectManageSfApiVersion, ['--app', appName, '--connection', resourceName, '--target-version', '61.0'])

    // Unsafe (Contact) first, safe change (Account) next, no-change (Opportunity) last.
    expect(stdout.indexOf('Contact')).toBeLessThan(stdout.indexOf('Account'))
    expect(stdout.indexOf('Account')).toBeLessThan(stdout.indexOf('Opportunity'))
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('renders each kind of change on its own line when a mapping has multiple', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    // The backend joins each kind of change with a newline.
    const diffApi = stubUpgrade({
      targetVersion: '61.0',
      mappings: [
        {
          name: 'Account',
          fields_have_changed: true,
          has_unsafe_changes: true,
          result_message: 'Length increased in Salesforce for field: name. \nFields removed from Salesforce: number. '
        }
      ]
    })

    const { stdout } = await runCommand(ConnectManageSfApiVersion, ['--app', appName, '--connection', resourceName, '--target-version', '61.0'])

    // Both segments appear, each on its own line (no run-on paragraph), and the
    // trailing whitespace each segment carries is trimmed off.
    expect(stdout).toContain('Length increased in Salesforce for field: name.')
    expect(stdout).toContain('Fields removed from Salesforce: number.')
    expect(stdout).not.toContain('name. Fields removed')
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
    const diffApi = stubUpgrade({ targetVersion: '61.0', body: responseBody })

    const { stdout } = await runCommand(ConnectManageSfApiVersion, ['--app', appName, '--connection', resourceName, '--target-version', '61.0', '--json'])

    expect(JSON.parse(stdout)).toEqual(responseBody)
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('shows the diff then upgrades when --confirm matches the app name', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = stubUpgrade({
      confirm: true,
      targetVersion: '61.0',
      mappings: [{ name: 'Account', result_message: 'ok', fields_have_changed: false }]
    })

    const { stdout } = await runCommand(ConnectManageSfApiVersion, [
      '--app', appName, '--connection', resourceName,
      '--target-version', '61.0', '--confirm', appName
    ])

    expect(stdout).toContain('Current API Version: 55.0')
    expect(stdout).toContain('Account')
    expect(stdout).toContain('Successfully changed version')
    expect(stdout).toContain('61.0')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('accepts --confirm with surrounding whitespace', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = stubUpgrade({ confirm: true, targetVersion: '61.0' })

    const { stdout } = await runCommand(ConnectManageSfApiVersion, [
      '--app', appName, '--connection', resourceName,
      '--target-version', '61.0', '--confirm', `  ${appName}  `
    ])

    expect(stdout).toContain('Successfully changed version')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('aborts before any upgrade call when --confirm does not match app name', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()

    const { error } = await runCommand(ConnectManageSfApiVersion, [
      '--app', appName, '--connection', resourceName,
      '--target-version', '61.0', '--confirm', 'wrong-name'
    ])

    expect(error).toBeDefined()
    expect(error.message).toContain('doesn’t match')
    // No POST should have been issued — the mismatch is caught before the call.
    expect(nock.pendingMocks()).toHaveLength(0)
    discoveryApi.done()
    connectionApi.done()
  })

  it('displays backend error message when upgrade returns a non-2xx response', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = stubUpgrade({
      confirm: true,
      targetVersion: '61.0',
      statusCode: 409,
      body: { message: 'Some mappings have unsafe changes. Edit them and retry.' }
    })

    const { error } = await runCommand(ConnectManageSfApiVersion, [
      '--app', appName, '--connection', resourceName,
      '--target-version', '61.0', '--confirm', appName
    ])

    expect(error).toBeDefined()
    expect(error.message).toContain('Some mappings have unsafe changes')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('falls back to the requested target_version when backend response omits it', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = stubUpgrade({ confirm: true, targetVersion: '61.0', body: '' })

    const { stdout } = await runCommand(ConnectManageSfApiVersion, [
      '--app', appName, '--connection', resourceName,
      '--target-version', '61.0', '--confirm', appName
    ])

    expect(stdout).toContain('Successfully changed version')
    expect(stdout).toContain('61.0')
    expect(stdout).not.toContain('undefined')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })
})
