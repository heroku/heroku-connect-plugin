/* globals describe beforeEach afterEach it */

import cli from '@heroku/heroku-cli-util'
import inquirer from 'inquirer'
import nock from 'nock'
import expect from 'unexpected'
import sinon from 'sinon'
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

async function expectThrows (fn) {
  let caught
  try {
    await fn()
  } catch (err) {
    caught = err
  }
  expect(caught, 'to be defined')
  return caught
}

describe('connect:upgrade-api-version', () => {
  beforeEach(() => {
    cli.mockConsole()
    process.env.HEROKU_API_KEY = password
  })

  afterEach(() => {
    delete process.env.HEROKU_API_KEY
    nock.cleanAll()
    sinon.restore()
  })

  it('rejects an invalid --target-version without contacting the API', async () => {
    const err = await expectThrows(() => runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName, '--target-version', 'not-a-version'
    ]))
    expect(err.message, 'to contain', 'Invalid --target-version')
    expect(nock.pendingMocks(), 'to be empty')
  })

  it('rejects a sub-floor --target-version (e.g. 1.0)', async () => {
    const err = await expectThrows(() => runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName, '--target-version', '1.0'
    ]))
    expect(err.message, 'to contain', 'Invalid --target-version')
    expect(nock.pendingMocks(), 'to be empty')
  })

  it('refuses to upgrade when the connection is not paused', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail({ state: 'IDLE' })

    const err = await expectThrows(() => runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName,
      '--target-version', '61.0', '--confirm', baseConnection.name
    ]))
    expect(err.message, 'to contain', 'must be paused')
    discoveryApi.done()
    connectionApi.done()
  })

  it('refuses to upgrade when already on the target version', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail({ api_version: '61.0' })

    const err = await expectThrows(() => runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName,
      '--target-version', '61.0', '--confirm', baseConnection.name
    ]))
    expect(err.message, 'to contain', 'already on API 61.0')
    discoveryApi.done()
    connectionApi.done()
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

  it('accepts --confirm with surrounding whitespace', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/actions/upgrade-api-version', { target_version: '61.0' })
      .reply(202, { target_version: '61.0' })

    await runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName,
      '--target-version', '61.0', '--confirm', `  ${baseConnection.name}  `
    ])

    expect(cli.stdout, 'to contain', 'Upgrade dispatched')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('passes force=true when --force is provided and posts force=true on a clean upgrade', async () => {
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

    const err = await expectThrows(() => runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName,
      '--target-version', '61.0', '--confirm', baseConnection.name
    ]))

    expect(err.message, 'to contain', 'unsafe field changes')
    expect(err.message, 'to contain', 'Account, Lead')
    expect(err.message, 'to contain', 'Re-run with --force')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('reports actionable error when --force is set but backend still returns unsafe_mappings', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/actions/upgrade-api-version', { target_version: '61.0', force: true })
      .reply(409, {
        error: 'unsafe',
        unsafe_mappings: ['Account']
      })

    const err = await expectThrows(() => runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName,
      '--target-version', '61.0', '--force', '--confirm', baseConnection.name
    ]))
    expect(err.message, 'to contain', 'refused even with --force')
    expect(err.message, 'to contain', 'Account')
    expect(err.message, 'to contain', 'Edit each mapping')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('reports dropped fields when --force is NOT passed', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/actions/upgrade-api-version', { target_version: '61.0' })
      .reply(409, {
        error: 'dropped',
        dropped_field_mappings: { Account: ['legacyfield__c'] }
      })

    const err = await expectThrows(() => runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName,
      '--target-version', '61.0', '--confirm', baseConnection.name
    ]))
    expect(err.message, 'to contain', 'no longer exist')
    expect(err.message, 'to contain', 'Account')
    expect(err.message, 'to contain', 'legacyfield__c')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('reports dropped fields when --force IS passed (force does not override drops)', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/actions/upgrade-api-version', { target_version: '61.0', force: true })
      .reply(409, {
        error: 'dropped',
        dropped_field_mappings: { Account: ['legacyfield__c'] }
      })

    const err = await expectThrows(() => runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName,
      '--target-version', '61.0', '--force', '--confirm', baseConnection.name
    ]))
    expect(err.message, 'to contain', 'no longer exist')
    expect(err.message, 'to contain', 'Account')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('refuses --json without --confirm (no auth-bypass)', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()

    const err = await expectThrows(() => runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName,
      '--target-version', '61.0', '--json'
    ]))
    expect(err.message, 'to contain', 'non-interactive')
    expect(err.message, 'to contain', '--confirm')
    discoveryApi.done()
    connectionApi.done()
  })

  it('outputs JSON when --json is passed with a valid --confirm', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const responseBody = { target_version: '61.0' }
    const upgradeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/actions/upgrade-api-version', { target_version: '61.0' })
      .reply(202, responseBody)

    await runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName,
      '--target-version', '61.0', '--json', '--confirm', baseConnection.name
    ])

    expect(JSON.parse(cli.stdout), 'to equal', responseBody)
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('--json + 409 surfaces a curated error and does not bypass on missing --confirm', async () => {
    // Two-part: first prove the no-confirm guard fires before any
    // network call; then prove that with --confirm a 409 still produces
    // a non-zero exit.
    const noConfirmDiscovery = stubDiscovery()
    const noConfirmDetail = stubConnectionDetail()
    let err = await expectThrows(() => runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName,
      '--target-version', '61.0', '--json'
    ]))
    expect(err.message, 'to contain', 'non-interactive')
    noConfirmDiscovery.done()
    noConfirmDetail.done()

    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/actions/upgrade-api-version', { target_version: '61.0' })
      .reply(409, { error: 'unsafe', unsafe_mappings: ['Account'] })

    err = await expectThrows(() => runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName,
      '--target-version', '61.0', '--json', '--confirm', baseConnection.name
    ]))
    expect(err.message, 'to contain', 'unsafe field changes')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('happy path through the interactive prompt when stdin is a TTY', async () => {
    const originalIsTTY = process.stdin.isTTY
    process.stdin.isTTY = true

    sinon.stub(inquirer, 'prompt').resolves({ confirmed: baseConnection.name })

    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/actions/upgrade-api-version', { target_version: '61.0' })
      .reply(202, { target_version: '61.0' })

    await runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName, '--target-version', '61.0'
    ])

    expect(cli.stdout, 'to contain', 'Upgrade dispatched')
    process.stdin.isTTY = originalIsTTY
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })

  it('aborts when the prompt response does not match the connection name', async () => {
    const originalIsTTY = process.stdin.isTTY
    process.stdin.isTTY = true

    sinon.stub(inquirer, 'prompt').resolves({ confirmed: 'wrong-name' })

    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()

    const err = await expectThrows(() => runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName, '--target-version', '61.0'
    ]))
    expect(err.message, 'to contain', 'Confirmation did not match')
    process.stdin.isTTY = originalIsTTY
    discoveryApi.done()
    connectionApi.done()
  })

  it('falls back to the requested target_version when backend response omits it', async () => {
    const discoveryApi = stubDiscovery()
    const connectionApi = stubConnectionDetail()
    const upgradeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/actions/upgrade-api-version', { target_version: '61.0' })
      .reply(202, '')

    await runCommand(ConnectUpgradeApiVersion, [
      '--app', appName, '--resource', resourceName,
      '--target-version', '61.0', '--confirm', baseConnection.name
    ])

    expect(cli.stdout, 'to contain', 'Upgrade dispatched')
    expect(cli.stdout, 'to contain', '61.0')
    expect(cli.stdout, 'not to contain', 'undefined')
    discoveryApi.done()
    connectionApi.done()
    upgradeApi.done()
  })
})
