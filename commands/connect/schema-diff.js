import { Command, flags } from '@heroku-cli/command'
import cli from '@heroku/heroku-cli-util'
import * as api from '../../lib/connect/api.js'
import { apiVersionFloor, isValidApiVersion } from '../../lib/connect/api-version.js'

export default class ConnectSchemaDiff extends Command {
  static description = `compare the schema of mappings in a connection between the current and a target Salesforce API version

Compares each mapping's Salesforce schema as it exists at the connection's current API version against a target API version, and reports per-mapping field-level changes. Use this before running connect:upgrade-api-version.`

  static examples = [
    '$ heroku connect:schema-diff --app my-app',
    '$ heroku connect:schema-diff --app my-app --target-version 61.0',
    '$ heroku connect:schema-diff --app my-app --json'
  ]

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' }),
    'target-version': flags.string({ description: 'Salesforce API version to compare against (e.g. 61.0). Defaults to the latest supported version.' }),
    json: flags.boolean({ description: 'print output as json' })
  }

  async run () {
    const { flags } = await this.parse(ConnectSchemaDiff)

    if (flags['target-version'] && !isValidApiVersion(flags['target-version'])) {
      this.error(
        `Invalid --target-version "${flags['target-version']}". Expected a Salesforce API version like "61.0" (>= ${apiVersionFloor()}.0).`,
        { exit: 2 }
      )
    }

    const context = {
      app: flags.app,
      flags,
      args: {},
      auth: { password: this.heroku.auth }
    }

    const connection = await api.withConnection(context, this.heroku)
    context.region = connection.region_url

    const params = flags['target-version']
      ? { target_version: flags['target-version'] }
      : undefined

    const response = await cli.action(
      'Comparing schemas',
      api.request(context, 'GET', `/api/v3/connections/${connection.id}/schema-diff`, undefined, params)
    )
    const result = response.data

    if (flags.json) {
      cli.styledJSON(result)
      return
    }

    cli.log()
    cli.styledHeader(`Connection: ${connection.name || connection.internal_name}`)
    cli.log(`Current API Version: ${result.current_api_version}`)
    cli.log(`Target API Version:  ${result.target_api_version}`)
    cli.log()

    cli.table(result.mappings || [], {
      columns: [
        { key: 'name', label: 'Mapping' },
        {
          key: 'fields_have_changed',
          label: 'Status',
          // The truth-table here is asymmetric on purpose: we only render
          // 'no changes' on an explicit `false` from the backend. Any other
          // shape (true, missing, drift) falls through to the bare 'changed'
          // label so we never report a false-negative when the backend
          // doesn't tell us.
          format: (changed, row) => {
            if (changed === false) return cli.color.green('no changes')
            if (row.has_unsafe_changes === true) return cli.color.red('changed (unsafe)')
            if (row.has_unsafe_changes === false) return cli.color.yellow('changed (safe)')
            return cli.color.yellow('changed')
          }
        },
        { key: 'result_message', label: 'Details' }
      ]
    })
    cli.log()
  }
}
