/* globals describe beforeEach afterEach it */

import cli from '@heroku/heroku-cli-util'
import nock from 'nock'
import expect from 'unexpected'
import ConnectUpgradeApiVersion from '../../../commands/connect/upgrade-api-version.js'
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

describe('connect:upgrade-api-version', () => {
  beforeEach(() => {
    cli.mockConsole()
    process.env.HEROKU_API_KEY = password
  })

  afterEach(() => {
    delete process.env.HEROKU_API_KEY
    nock.cleanAll()
  })

  it('rejects an invalid --target-version without contacting the API', async () => {
    await runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName, '--target-version', 'not-a-version'
    ])

    expect(cli.stderr, 'to contain', 'Invalid --target-version')
    expect(nock.pendingMocks(), 'to be empty')
  })

  it('posts target_version and confirms via --confirm', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/actions/upgrade-api-version', { target_version: '61.0' })
      .reply(202, { target_version: '61.0' })

    await runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName,
      '--target-version', '61.0', '--confirm', baseConnection.name
    ])

    expect(cli.stdout, 'to contain', 'Upgrade dispatched')
    expect(cli.stdout, 'to contain', '61.0')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('passes force=true when --force is provided', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/actions/upgrade-api-version', { target_version: '61.0', force: true })
      .reply(202, { target_version: '61.0' })

    await runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName,
      '--target-version', '61.0', '--force', '--confirm', baseConnection.name
    ])

    expect(cli.stdout, 'to contain', 'Upgrade dispatched')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('reports unsafe mappings when backend returns 409 with unsafe_mappings', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/actions/upgrade-api-version', { target_version: '61.0' })
      .reply(409, {
        error: 'unsafe',
        unsafe_mappings: ['Account', 'Lead']
      })

    await runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName,
      '--target-version', '61.0', '--confirm', baseConnection.name
    ])

    expect(cli.stderr, 'to contain', 'unsafe field changes')
    expect(cli.stderr, 'to contain', 'Account, Lead')
    expect(cli.stderr, 'to contain', '--force')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('reports dropped fields when backend returns 409 with dropped_field_mappings', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/actions/upgrade-api-version', { target_version: '61.0', force: true })
      .reply(409, {
        error: 'dropped',
        dropped_field_mappings: { Account: ['legacyfield__c'] }
      })

    await runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName,
      '--target-version', '61.0', '--force', '--confirm', baseConnection.name
    ])

    expect(cli.stderr, 'to contain', 'no longer exist')
    expect(cli.stderr, 'to contain', 'Account')
    expect(cli.stderr, 'to contain', 'legacyfield__c')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('outputs JSON when --json is passed', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const responseBody = { target_version: '61.0' }
    const upgradeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/actions/upgrade-api-version', { target_version: '61.0' })
      .reply(202, responseBody)

    await runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName,
      '--target-version', '61.0', '--json'
    ])

    expect(JSON.parse(cli.stdout), 'to equal', responseBody)
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })
})
