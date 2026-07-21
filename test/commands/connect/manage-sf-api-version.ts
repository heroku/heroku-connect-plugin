import {runCommand} from '@heroku-cli/test-utils'
import nock from 'nock'
import {
  afterEach, beforeEach, describe, expect, it,
} from 'vitest'

import ConnectManageSfApiVersion from '../../../src/commands/connect/manage-sf-api-version.js'

const password = 's3cr3t3'
const headers = {
  authorization: `Bearer ${password}`,
  'content-type': 'application/json',
  'heroku-client': 'cli',
}

const appName = 'fake-app'
const resourceName = 'abcd-ef01'
const connectionDetailUrl = 'https://hc-virginia-qa.herokai.com/connections/1234'

const baseConnection = {
  api_version: '55.0',
  id: 1234,
  name: 'fake-app:fake-conn',
  region_url: 'https://hc-virginia-qa.herokai.com/',
  state: 'PAUSED',
}

function stubDiscovery() {
  return nock('https://hc-central-qa.herokai.com/', {reqheaders: headers})
    .get('/connections')
    .query({app: appName, resource_name: resourceName})
    .reply(200, {results: [{detail_url: connectionDetailUrl}]})
}

function stubConnectionDetail(extra: Record<string, unknown> = {}) {
  return nock('https://hc-virginia-qa.herokai.com/', {reqheaders: headers})
    .get('/connections/1234')
    .query({deep: true})
    .reply(200, {...baseConnection, ...extra})
}

type StubUpgradeOptions = {
  body?: unknown
  confirm?: boolean
  mappings?: Array<Record<string, unknown>>
  statusCode?: null | number
  targetVersion?: string
}

// Two endpoints: the GET schema-diff preview and the POST change action.
// Both return the diff payload; the change action also echoes target_version.
function stubUpgrade({
  body = null,
  confirm = false,
  mappings = [],
  statusCode = null,
  targetVersion = '61.0',
}: StubUpgradeOptions = {}) {
  const responseStatus = statusCode || (confirm ? 202 : 200)
  const responseBody = body || {
    current_api_version: '55.0',
    guid: '1234',
    mappings,
    target_api_version: targetVersion,
    ...(confirm ? {target_version: targetVersion} : {}),
  }
  const scope = nock('https://hc-virginia-qa.herokai.com/', {reqheaders: headers})
  return confirm
    ? scope
      .post('/api/v3/connections/1234/actions/change-sf-api-version', {target_version: targetVersion})
      .reply(responseStatus, responseBody as nock.Body)
    : scope
      .get('/api/v3/connections/1234/schema-diff')
      .query({target_version: targetVersion})
      .reply(responseStatus, responseBody as nock.Body)
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
    const {error} = await runCommand(ConnectManageSfApiVersion, [
      '--app', appName, '--connection', resourceName, '--target-version', 'not-a-version',
    ])
    expect(error).toBeDefined()
    expect(error?.message).toContain('--target-version "not-a-version" is invalid')
    expect(nock.pendingMocks()).toHaveLength(0)
  })

  it('emits a structured JSON error for an invalid --target-version when --json is passed', async () => {
    const {stdout} = await runCommand(ConnectManageSfApiVersion, [
      '--app', appName, '--connection', resourceName, '--target-version', 'not-a-version', '--json',
    ])
    const parsed = JSON.parse(stdout)
    expect(parsed.error).toContain('--target-version "not-a-version" is invalid')
    expect(nock.pendingMocks()).toHaveLength(0)
  })

  it('emits a structured JSON error for a --confirm mismatch when --json is passed', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()

    const {stdout} = await runCommand(ConnectManageSfApiVersion, [
      '--app',
      appName,
      '--connection',
      resourceName,
      '--target-version',
      '61.0',
      '--confirm',
      'wrong-name',
      '--json',
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
      body: {message: 'Some mappings have unsafe changes. Edit them and retry.'},
      confirm: true,
      statusCode: 409,
      targetVersion: '61.0',
    })

    const {stdout} = await runCommand(ConnectManageSfApiVersion, [
      '--app',
      appName,
      '--connection',
      resourceName,
      '--target-version',
      '61.0',
      '--confirm',
      appName,
      '--json',
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
    const diffApi = stubUpgrade({targetVersion: '61.0'})

    const {stdout} = await runCommand(ConnectManageSfApiVersion, ['--app', appName, '--connection', resourceName, '--target-version', '61'])

    expect(stdout).toContain('Target API Version:  61.0')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('renders the diff table without upgrading when --confirm is omitted', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = stubUpgrade({
      mappings: [
        {fields_have_changed: false, name: 'Account', result_message: 'UNCHANGED_DETAILS'},
        {fields_have_changed: true, name: 'Lead', result_message: 'CHANGED_DETAILS'},
      ],
      targetVersion: '61.0',
    })

    const {stdout} = await runCommand(ConnectManageSfApiVersion, ['--app', appName, '--connection', resourceName, '--target-version', '61.0'])

    expect(stdout).toContain('Current API Version: 55.0')
    expect(stdout).toContain('Target API Version:  61.0')
    expect(stdout).toContain('Account')
    expect(stdout).toContain('No action required')
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
      mappings: [
        {
          fields_have_changed: true, has_unsafe_changes: false, name: 'Account', result_message: 'length increase',
        },
        {
          fields_have_changed: true, has_unsafe_changes: true, name: 'Contact', result_message: 'field removed',
        },
      ],
      targetVersion: '61.0',
    })

    const {stdout} = await runCommand(ConnectManageSfApiVersion, ['--app', appName, '--connection', resourceName, '--target-version', '61.0'])

    expect(stdout).toContain('Action required')
    expect(stdout).toContain('No action required')
    expect(stdout).not.toContain('(safe)')
    expect(stdout).not.toContain('(unsafe)')
    expect(stdout.indexOf('Contact')).toBeLessThan(stdout.indexOf('Account'))
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('orders rows unsafe, then safe changes, then no changes', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = stubUpgrade({
      mappings: [
        {
          fields_have_changed: false, has_unsafe_changes: false, name: 'Opportunity', result_message: 'no changes',
        },
        {
          fields_have_changed: true, has_unsafe_changes: false, name: 'Account', result_message: 'length increase',
        },
        {
          fields_have_changed: true, has_unsafe_changes: true, name: 'Contact', result_message: 'field removed',
        },
      ],
      targetVersion: '61.0',
    })

    const {stdout} = await runCommand(ConnectManageSfApiVersion, ['--app', appName, '--connection', resourceName, '--target-version', '61.0'])

    expect(stdout.indexOf('Contact')).toBeLessThan(stdout.indexOf('Account'))
    expect(stdout.indexOf('Account')).toBeLessThan(stdout.indexOf('Opportunity'))
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('renders each kind of change on its own line when a mapping has multiple', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = stubUpgrade({
      mappings: [
        {
          fields_have_changed: true,
          has_unsafe_changes: true,
          name: 'Account',
          result_message: 'Length increased in Salesforce for field: name. \nFields removed from Salesforce: number. ',
        },
      ],
      targetVersion: '61.0',
    })

    const {stdout} = await runCommand(ConnectManageSfApiVersion, ['--app', appName, '--connection', resourceName, '--target-version', '61.0'])

    expect(stdout).toContain('Length increased in Salesforce for field: name.')
    expect(stdout).toContain('Fields removed from Salesforce: number.')
    expect(stdout).not.toContain('name. Fields removed')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('flags mappings we can\'t assess and orders them right after unsafe changes', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const diffApi = stubUpgrade({
      mappings: [
        {
          action_undetermined: false, fields_have_changed: false, has_unsafe_changes: false, name: 'Opportunity', result_message: 'no changes',
        },
        {
          action_undetermined: true, fields_have_changed: false, has_unsafe_changes: false, name: 'Lead', result_message: 'Unable to determine if an action is required.',
        },
        {
          action_undetermined: false, fields_have_changed: true, has_unsafe_changes: false, name: 'Account', result_message: 'length increase',
        },
        {
          action_undetermined: false, fields_have_changed: true, has_unsafe_changes: true, name: 'Contact', result_message: 'field removed',
        },
      ],
      targetVersion: '61.0',
    })

    const {stdout} = await runCommand(ConnectManageSfApiVersion, ['--app', appName, '--connection', resourceName, '--target-version', '61.0'])

    expect(stdout).toContain('Action undetermined')
    expect(stdout).toContain('Unable to determine if an action is required.')
    expect(stdout.indexOf('Contact')).toBeLessThan(stdout.indexOf('Lead'))
    expect(stdout.indexOf('Lead')).toBeLessThan(stdout.indexOf('Account'))
    expect(stdout.indexOf('Account')).toBeLessThan(stdout.indexOf('Opportunity'))
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('outputs JSON when --json is passed', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const responseBody = {
      current_api_version: '55.0',
      guid: '1234',
      mappings: [{fields_have_changed: false, name: 'Account', result_message: 'ok'}],
      target_api_version: '61.0',
    }
    const diffApi = stubUpgrade({body: responseBody, targetVersion: '61.0'})

    const {stdout} = await runCommand(ConnectManageSfApiVersion, ['--app', appName, '--connection', resourceName, '--target-version', '61.0', '--json'])

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
      mappings: [{fields_have_changed: false, name: 'Account', result_message: 'ok'}],
      targetVersion: '61.0',
    })

    const {stdout} = await runCommand(ConnectManageSfApiVersion, [
      '--app',
      appName,
      '--connection',
      resourceName,
      '--target-version',
      '61.0',
      '--confirm',
      appName,
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
    const upgradeApi = stubUpgrade({confirm: true, targetVersion: '61.0'})

    const {stdout} = await runCommand(ConnectManageSfApiVersion, [
      '--app',
      appName,
      '--connection',
      resourceName,
      '--target-version',
      '61.0',
      '--confirm',
      `  ${appName}  `,
    ])

    expect(stdout).toContain('Successfully changed version')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('aborts before any upgrade call when --confirm does not match app name', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()

    const {error} = await runCommand(ConnectManageSfApiVersion, [
      '--app',
      appName,
      '--connection',
      resourceName,
      '--target-version',
      '61.0',
      '--confirm',
      'wrong-name',
    ])

    expect(error).toBeDefined()
    expect(error?.message).toContain('doesn’t match')
    expect(nock.pendingMocks()).toHaveLength(0)
    discoveryApi.done()
    connectionApi.done()
  })

  it('surfaces the backend 409 verbatim when a mapping is still syncing', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail({
      mappings: [{object_name: 'Contact', state: 'POLLING_SF_CHANGES'}],
    })
    const upgradeApi = stubUpgrade({
      body: {
        error: 'Mapping Contact is still syncing. Wait for it to finish syncing before changing the API version.',
        syncing_mappings: ['Contact'],
      },
      confirm: true,
      statusCode: 409,
      targetVersion: '61.0',
    })

    const {error} = await runCommand(ConnectManageSfApiVersion, [
      '--app',
      appName,
      '--connection',
      resourceName,
      '--target-version',
      '61.0',
      '--confirm',
      appName,
    ])

    expect(error).toBeDefined()
    expect(error?.message).toBe('Mapping Contact is still syncing. Wait for it to finish syncing before changing the API version.')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('allows --confirm and upgrades when the backend accepts the change', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail({
      mappings: [{object_name: 'Account', state: 'DATA_SYNCED'}],
    })
    const upgradeApi = stubUpgrade({confirm: true, targetVersion: '61.0'})

    const {stdout} = await runCommand(ConnectManageSfApiVersion, [
      '--app',
      appName,
      '--connection',
      resourceName,
      '--target-version',
      '61.0',
      '--confirm',
      appName,
    ])

    expect(stdout).toContain('Successfully changed version')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('does not gate the read-only preview on mapping sync state', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail({
      mappings: [{object_name: 'Contact', state: 'POLLING_SF_CHANGES'}],
    })
    const diffApi = stubUpgrade({targetVersion: '61.0'})

    const {stdout} = await runCommand(ConnectManageSfApiVersion, [
      '--app', appName, '--connection', resourceName, '--target-version', '61.0',
    ])

    expect(stdout).toContain('Target API Version:  61.0')
    discoveryApi.done()
    connectionApi.done()
    diffApi.done()
  })

  it('displays backend error message when upgrade returns a non-2xx response', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = stubUpgrade({
      body: {message: 'Some mappings have unsafe changes. Edit them and retry.'},
      confirm: true,
      statusCode: 409,
      targetVersion: '61.0',
    })

    const {error} = await runCommand(ConnectManageSfApiVersion, [
      '--app',
      appName,
      '--connection',
      resourceName,
      '--target-version',
      '61.0',
      '--confirm',
      appName,
    ])

    expect(error).toBeDefined()
    expect(error?.message).toContain('Some mappings have unsafe changes')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('renders the diff table when the upgrade is rejected because a mapping needs action', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = stubUpgrade({
      body: {
        current_api_version: '55.0',
        mappings: [
          {
            fields_have_changed: true, has_unsafe_changes: false, name: 'Account', result_message: 'length increase',
          },
          {
            fields_have_changed: true, has_unsafe_changes: true, name: 'Contact', result_message: 'field removed',
          },
        ],
        message: 'Some mappings have unsafe changes. Edit them and retry.',
        target_api_version: '61.0',
      },
      confirm: true,
      statusCode: 409,
      targetVersion: '61.0',
    })

    const {error, stdout} = await runCommand(ConnectManageSfApiVersion, [
      '--app',
      appName,
      '--connection',
      resourceName,
      '--target-version',
      '61.0',
      '--confirm',
      appName,
    ])

    expect(stdout).toContain('Current API Version: 55.0')
    expect(stdout).toContain('Contact')
    expect(stdout).toContain('Action required')
    expect(stdout.indexOf('Contact')).toBeLessThan(stdout.indexOf('Account'))
    expect(error).toBeDefined()
    expect(error?.message).toContain('Some mappings have unsafe changes')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('does not render the diff table on error when --json is passed', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = stubUpgrade({
      body: {
        current_api_version: '55.0',
        mappings: [
          {
            fields_have_changed: true, has_unsafe_changes: true, name: 'Contact', result_message: 'field removed',
          },
        ],
        message: 'Some mappings have unsafe changes. Edit them and retry.',
        target_api_version: '61.0',
      },
      confirm: true,
      statusCode: 409,
      targetVersion: '61.0',
    })

    const {stdout} = await runCommand(ConnectManageSfApiVersion, [
      '--app',
      appName,
      '--connection',
      resourceName,
      '--target-version',
      '61.0',
      '--confirm',
      appName,
      '--json',
    ])

    const parsed = JSON.parse(stdout)
    expect(parsed.error).toContain('Some mappings have unsafe changes')
    expect(stdout).not.toContain('Action required')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('falls back to the requested target_version when backend response omits it', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = stubUpgrade({body: '', confirm: true, targetVersion: '61.0'})

    const {stdout} = await runCommand(ConnectManageSfApiVersion, [
      '--app',
      appName,
      '--connection',
      resourceName,
      '--target-version',
      '61.0',
      '--confirm',
      appName,
    ])

    expect(stdout).toContain('Successfully changed version')
    expect(stdout).toContain('61.0')
    expect(stdout).not.toContain('undefined')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })
})
