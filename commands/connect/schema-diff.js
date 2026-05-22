import { Command, flags } from '@heroku-cli/command'
import cli from '@heroku/heroku-cli-util'
import * as api from '../../lib/connect/api.js'

export default class ConnectSchemaDiff extends Command {
  static description = 'compare the schema of mappings in a connection between the current and a target Salesforce API version'

  static help = 'Compares each mapping\'s Salesforce schema as it exists at the connection\'s current API version against a target API version, and reports per-mapping field-level changes. Use this before running connect:upgrade-api-version.'

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' }),
    'target-version': flags.string({ description: 'Salesforce API version to compare against (e.g. 61.0). Defaults to the latest supported version.' }),
    json: flags.boolean({ description: 'print output as json' })
  }

  async run () {
    const { flags } = await this.parse(ConnectSchemaDiff)
    const context = {
      app: flags.app,
      flags,
      args: {},
      auth: { password: this.heroku.auth }
    }

    const connection = await api.withConnection(context, this.heroku)
    context.region = connection.region_url

    let url = `/api/v3/connections/${connection.id}/schema-diff`
    if (flags['target-version']) {
      if (!isValidApiVersion(flags['target-version'])) {
        cli.error(`Invalid --target-version "${flags['target-version']}". Expected a Salesforce API version like "61.0".`)
        return
      }
      url += `?target_version=${encodeURIComponent(flags['target-version'])}`
    }

    const response = await cli.action(
      'Comparing schemas',
      api.request(context, 'GET', url)
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

    cli.table(result.mappings, {
      columns: [
        { key: 'name', label: 'Mapping' },
        {
          key: 'fields_have_changed',
          label: 'Status',
          format: (changed, row) => {
            if (!changed) return cli.color.green('no changes')
            // Backend may surface has_unsafe_changes once the upgrade work lands.
            // Until then, all "changed" rows render the same.
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

function isValidApiVersion (value) {
  return /^\d{1,3}\.\d$/.test(value)
}
