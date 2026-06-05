import { Command, flags } from '@heroku-cli/command'
import cli from '@heroku/heroku-cli-util'
import * as api from '../../lib/connect/api.js'
import { apiVersionFloor, isValidApiVersion } from '../../lib/connect/api-version.js'

export default class ConnectSfApiUpgrade extends Command {
  static description = `compare mapping schemas between API versions and optionally upgrade

Shows a per-mapping field diff between the connection's current Salesforce API version and a target version. Pass --confirm to also run the upgrade after displaying the diff. The connection must be paused before upgrading.`

  static examples = [
    '$ heroku connect:sf-api-upgrade --app my-app --target-version 61.0',
    '$ heroku connect:sf-api-upgrade --app my-app --target-version 61.0 --confirm my-app:fake-conn',
    '$ heroku connect:sf-api-upgrade --app my-app --target-version 61.0 --json'
  ]

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' }),
    'target-version': flags.string({ required: true, description: 'Salesforce API version to compare against and upgrade to (e.g. 61.0)' }),
    confirm: flags.string({ description: 'after showing the diff, upgrade the connection — pass the connection name to confirm' }),
    json: flags.boolean({ description: 'print output as json' })
  }

  async run () {
    const { flags: parsed } = await this.parse(ConnectSfApiUpgrade)

    if (!isValidApiVersion(parsed['target-version'])) {
      this.error(
        `Invalid --target-version "${parsed['target-version']}". Expected a Salesforce API version like "61.0" (>= ${apiVersionFloor()}.0).`,
        { exit: 2 }
      )
    }

    const context = {
      app: parsed.app,
      flags: parsed,
      args: {},
      auth: { password: this.heroku.auth }
    }

    const connection = await api.withConnection(context, this.heroku)
    context.region = connection.region_url

    const diffResponse = await cli.action(
      'Comparing schemas',
      api.request(context, 'GET', `/api/v3/connections/${connection.id}/schema-diff`, undefined, { target_version: parsed['target-version'] })
    )
    const result = diffResponse.data

    if (parsed.json) {
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

    if (!parsed.confirm) return

    if (connection.state !== 'PAUSED') {
      this.error(
        `Connection ${connection.name} must be paused before upgrading. ` +
        `Run \`heroku connect:pause -a ${parsed.app}\`.`,
        { exit: 1 }
      )
    }
    if (connection.api_version === parsed['target-version']) {
      this.error(
        `Connection ${connection.name} is already on API ${connection.api_version}.`,
        { exit: 1 }
      )
    }

    const confirmName = parsed.confirm.trim()
    if (confirmName !== connection.name) {
      this.error(
        `--confirm value "${confirmName}" does not match connection name "${connection.name}". Aborting.`,
        { exit: 1 }
      )
    }

    let upgradeResponse
    try {
      upgradeResponse = await cli.action(
        `Upgrading ${connection.name} to API ${parsed['target-version']}`,
        (async () => api.request(context, 'POST', `/api/v3/connections/${connection.id}/actions/upgrade-api-version`, { target_version: parsed['target-version'] }))()
      )
    } catch (err) {
      const data = err && err.response && err.response.data
        ? err.response.data
        : (err && err.body ? err.body : null)
      const message = (data && (data.message || data.error)) || (err && err.message) || 'unknown error'
      this.error(message, { exit: 1 })
      return
    }

    const reportedVersion = (upgradeResponse.data && upgradeResponse.data.target_version) || parsed['target-version']
    cli.log(cli.color.green(`Upgrade dispatched. ${connection.name} will run at Salesforce API ${reportedVersion}.`))
    cli.log('Run `heroku connect:resume` when you are ready to resume sync.')
  }
}
