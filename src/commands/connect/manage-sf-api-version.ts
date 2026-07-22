import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {styledHeader, styledJSON, table} from '@heroku/heroku-cli-util/hux'
import {ux} from '@oclif/core'

import {ConnectContext} from '../../lib/clients/connect.js'
import {normalizeApiVersion} from '../../lib/connect/api-version.js'
import * as api from '../../lib/connect/api.js'

type DiffMapping = {
  action_undetermined?: boolean
  fields_have_changed?: boolean
  has_unsafe_changes?: boolean
  name: string
  result_message?: string
}

type DiffPayload = {
  current_api_version?: string
  error?: string
  mappings?: DiffMapping[]
  message?: string
  target_api_version?: string
  target_version?: string
}

function rowRank(row: DiffMapping): number {
  if (row.has_unsafe_changes === true) return 0
  if (row.action_undetermined === true) return 1
  return row.fields_have_changed === true ? 2 : 3
}

export default class ConnectManageSfApiVersion extends Command {
  static description = `compare mapping schemas between API versions and optionally change the version

Shows a per-mapping field diff between the connection's current Salesforce API version and a target version. \
Pass --confirm to also change the connection to the target version after displaying the diff. \
The connection must be paused before changing the version.`
  static examples = [
    '$ heroku connect:manage-sf-api-version --app my-app --connection herokuconnect-swiftly-54348 --target-version 61.0',
    '$ heroku connect:manage-sf-api-version --app my-app --connection herokuconnect-swiftly-54348 --target-version 61.0 --confirm my-app',
    '$ heroku connect:manage-sf-api-version --app my-app --connection herokuconnect-swiftly-54348 --target-version 61.0 --json',
  ]
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({description: 'pass the app name to change the connection to the target version after showing the schema differences'}),
    connection: flags.string({description: 'connection resource name', required: true}),
    json: flags.boolean({description: 'print output as json'}),
    'target-version': flags.string({description: 'Salesforce API version to compare against and change to (example: 61.0)', required: true}),
  }

  fail(json: boolean, message: string, exit: number): never {
    if (json) {
      styledJSON({error: message})
      this.exit(exit)
    }

    this.error(message, {exit})
  }

  async fetchResult(
    context: ConnectContext,
    connection: api.Connection,
    connectionName: string,
    targetVersion: string,
    confirmed: boolean,
    json: boolean,
  ): Promise<DiffPayload> {
    const basePath = `/api/v3/connections/${connection.id}`
    try {
      ux.action.start(confirmed ? `Changing ${connectionName} to Salesforce API version ${targetVersion}` : 'Comparing schemas')
      const response = await (confirmed
        ? api.request(context, 'POST', `${basePath}/actions/change-sf-api-version`, {target_version: targetVersion})
        : api.request(context, 'GET', `${basePath}/schema-diff`, undefined, {target_version: targetVersion}))
      ux.action.stop()
      return (response.data as DiffPayload) || {}
    } catch (error) {
      ux.action.stop('error')
      const err = error as {body?: DiffPayload; message?: string; response?: {data?: DiffPayload}}
      const data = err.response?.data ?? err.body ?? null
      const message = data?.message || data?.error || err.message || 'unknown error'
      if (!json && data && Array.isArray(data.mappings) && data.mappings.length > 0) {
        this.printDiff(data, connectionName, targetVersion)
      }

      this.fail(json, message, 1)
    }
  }

  printDiff(result: DiffPayload, connectionName: string, targetVersion: string): void {
    ux.stdout()
    styledHeader(`Connection: ${connectionName}`)
    ux.stdout(`Current API Version: ${result.current_api_version}`)
    ux.stdout(`Target API Version:  ${result.target_api_version || targetVersion}`)
    ux.stdout()

    const rows = [...(result.mappings || [])].sort((a, b) => rowRank(a) - rowRank(b))

    /* eslint-disable perfectionist/sort-objects */
    table(rows as unknown as Array<Record<string, unknown>>, {
      name: {header: 'Mapping'},
      fields_have_changed: {
        get(row: Record<string, unknown>): string {
          const r = row as unknown as DiffMapping
          if (r.has_unsafe_changes === true) return color.red('Action required')
          if (r.action_undetermined === true) return color.yellow('Action undetermined')
          return 'No action required'
        },
        header: 'Status',
      },
      result_message: {
        get(row: Record<string, unknown>): string {
          const r = row as unknown as DiffMapping
          const message = r.result_message
          if ((r.fields_have_changed !== true && r.action_undetermined !== true) || !message) return ''
          return message.split('\n').map(line => line.trim()).filter(Boolean).join('\n')
        },
        header: 'Details',
      },
    }, {maxWidth: 'none', overflow: 'wrap'})
    ux.stdout()
  }
  /* eslint-enable perfectionist/sort-objects */

  async run(): Promise<void> {
    const {flags: parsed} = await this.parse(ConnectManageSfApiVersion)

    const targetVersion = normalizeApiVersion(parsed['target-version'])

    if (!targetVersion) {
      this.fail(
        parsed.json,
        `--target-version "${parsed['target-version']}" is invalid. Enter a numeric Salesforce API version (for example: 61 or 61.0) and try again.`,
        2,
      )
    }

    const context: ConnectContext = {
      app: parsed.app,
      args: {},
      auth: {password: (await this.heroku.getAuth()) as string},
      flags: {...parsed, resource: parsed.connection},
    }

    const connection = await api.withConnection(context)
    context.region = connection.region_url

    const confirmed = this.validateConfirm(parsed.confirm, parsed.app, parsed.json)
    const connectionName = connection.name || connection.internal_name || ''

    const result = await this.fetchResult(context, connection, connectionName, targetVersion, confirmed, parsed.json)

    if (parsed.json) {
      styledJSON(result)
      return
    }

    this.printDiff(result, connectionName, targetVersion)

    if (!confirmed) {
      ux.stdout(`To change ${connectionName} to Salesforce API ${targetVersion}, re-run this command with --confirm ${parsed.app}.`)
      return
    }

    const reportedVersion = result.target_version || targetVersion
    ux.stdout(color.green(`Successfully changed version on ${connectionName} to Salesforce API ${reportedVersion}. Run heroku connect:resume to resume sync.`))
  }

  validateConfirm(confirm: string | undefined, app: string, json: boolean): boolean {
    if (!confirm) return false
    const confirmName = confirm.trim()
    if (confirmName !== app) {
      this.fail(
        json,
        `--confirm value "${confirmName}" doesn’t match app name "${app}". Canceling version change.`,
        1,
      )
    }

    return true
  }
}
