import { Command, flags } from '@heroku-cli/command'
import cli from '@heroku/heroku-cli-util'
import * as api from '../../lib/connect/api.js'
import { normalizeApiVersion } from '../../lib/connect/api-version.js'

export default class ConnectManageSfApiVersion extends Command {
  static description = `compare mapping schemas between API versions and optionally change the version

Shows a per-mapping field diff between the connection's current Salesforce API version and a target version. Pass --confirm to also change the connection to the target version after displaying the diff. The connection must be paused before changing the version.`

  static examples = [
    '$ heroku connect:manage-sf-api-version --app my-app --target-version 61.0',
    '$ heroku connect:manage-sf-api-version --app my-app --connection abcd-ef01 --target-version 61.0',
    '$ heroku connect:manage-sf-api-version --app my-app --target-version 61.0 --confirm my-app',
    '$ heroku connect:manage-sf-api-version --app my-app --target-version 61.0 --json'
  ]

  static flags = {
    app: flags.app({ required: true }),
    connection: flags.string({ required: true, description: 'connection resource name' }),
    'target-version': flags.string({ required: true, description: 'Salesforce API version to compare against and change to (example: 61.0)' }),
    confirm: flags.string({ description: 'pass the app name to change the connection to the target version after showing the schema differences' }),
    json: flags.boolean({ description: 'print output as json' })
  }

  async run () {
    const { flags: parsed } = await this.parse(ConnectManageSfApiVersion)

    const targetVersion = normalizeApiVersion(parsed['target-version'])

    if (!targetVersion) {
      this.error(
        `--target-version "${parsed['target-version']}" is invalid. Enter a numeric Salesforce API version (for example: 61 or 61.0) and try again.`,
        { exit: 2 }
      )
    }

    const context = {
      app: parsed.app,
      flags: { ...parsed, resource: parsed.connection },
      args: {},
      auth: { password: this.heroku.auth }
    }

    const connection = await api.withConnection(context, this.heroku)
    context.region = connection.region_url

    // Validate --confirm before any network call so a mismatch fails fast.
    let confirmed = false
    if (parsed.confirm) {
      const confirmName = parsed.confirm.trim()
      if (confirmName !== parsed.app) {
        this.error(
          `--confirm value "${confirmName}" doesn’t match app name "${parsed.app}". Canceling version change.`,
          { exit: 1 }
        )
      }
      confirmed = true
    }

    const connectionName = connection.name || connection.internal_name

    // Two endpoints, one call per action: preview reads the diff from the
    // schema-diff endpoint; confirming performs the version change, whose
    // response also carries the diff — so the diff is only ever computed once
    // per invocation (we never call both).
    const basePath = `/api/v3/connections/${connection.id}`
    let response
    try {
      response = await cli.action(
        confirmed ? `Changing ${connectionName} to API ${targetVersion}` : 'Comparing schemas',
        (async () => confirmed
          ? api.request(context, 'POST', `${basePath}/actions/change-sf-api-version`, { target_version: targetVersion })
          : api.request(context, 'GET', `${basePath}/schema-diff`, undefined, { target_version: targetVersion }))()
      )
    } catch (err) {
      const data = err && err.response && err.response.data
        ? err.response.data
        : (err && err.body ? err.body : null)
      const message = (data && (data.message || data.error)) || (err && err.message) || 'unknown error'
      this.error(message, { exit: 1 })
      return
    }

    const result = response.data || {}

    if (parsed.json) {
      cli.styledJSON(result)
      return
    }

    cli.log()
    cli.styledHeader(`Connection: ${connectionName}`)
    cli.log(`Current API Version: ${result.current_api_version}`)
    cli.log(`Target API Version:  ${result.target_api_version || targetVersion}`)
    cli.log()

    // Order rows by how much attention they need: "Action required" (unsafe)
    // first, then safe changes, then untouched "No changes" rows last. Stable
    // sort preserves the backend's ordering within each group.
    const rowRank = (row) =>
      row.has_unsafe_changes === true ? 0 : row.fields_have_changed === true ? 1 : 2
    const rows = (result.mappings || []).slice().sort((a, b) => rowRank(a) - rowRank(b))

    cli.table(rows, {
      columns: [
        { key: 'name', label: 'Mapping' },
        {
          key: 'fields_have_changed',
          label: 'Status',
          format: (changed, row) => {
            // Status is framed purely by whether the customer must act: unsafe/
            // dropped-field changes need them to unmap & re-map ("Action
            // required", red); everything else — including no change at all —
            // needs nothing from them. Whether anything actually changed is
            // conveyed by the Details column. The label carries the meaning so
            // it still reads correctly without color (--no-color / piped).
            if (row.has_unsafe_changes === true) return cli.color.red('Action required')
            return 'No action required'
          }
        },
        {
          key: 'result_message',
          label: 'Details',
          // Only show details when something actually changed; a "no changes"
          // row leaves the column blank rather than restating the obvious.
          format: (message, row) => (row.fields_have_changed === true ? message : '')
        }
      ]
    })
    cli.log()

    if (!confirmed) {
      cli.log(`To change ${connectionName} to Salesforce API ${targetVersion}, re-run this command with --confirm ${parsed.app}.`)
      return
    }

    const reportedVersion = result.target_version || targetVersion
    cli.log(cli.color.green(`Successfully changed version on ${connectionName} to Salesforce API ${reportedVersion}. Run heroku connect:resume to resume sync.`))
  }
}
