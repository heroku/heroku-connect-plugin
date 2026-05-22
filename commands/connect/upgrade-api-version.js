import { Command, flags } from '@heroku-cli/command'
import cli from '@heroku/heroku-cli-util'
import inquirer from 'inquirer'
import * as api from '../../lib/connect/api.js'

export default class ConnectUpgradeApiVersion extends Command {
  static description = 'upgrade a connection to a newer Salesforce API version'

  static help = 'The connection must be paused before running this command. Run `connect:schema-diff` first to preview the changes.'

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' }),
    'target-version': flags.string({ required: true, description: 'Salesforce API version to upgrade to (e.g. 61.0)' }),
    force: flags.boolean({ description: 'proceed even when mappings have unsafe changes (does not override dropped fields)' }),
    confirm: flags.string({ description: 'skip the interactive confirmation by passing the connection name' }),
    json: flags.boolean({ description: 'print output as json' })
  }

  async run () {
    const { flags } = await this.parse(ConnectUpgradeApiVersion)

    if (!isValidApiVersion(flags['target-version'])) {
      cli.error(`Invalid --target-version "${flags['target-version']}". Expected a Salesforce API version like "61.0".`)
      return
    }

    const context = {
      app: flags.app,
      flags,
      args: {},
      auth: { password: this.heroku.auth }
    }

    const connection = await api.withConnection(context, this.heroku)
    context.region = connection.region_url

    if (!flags.json && flags.confirm !== connection.name) {
      const { confirmed } = await inquirer.prompt([{
        name: 'confirmed',
        type: 'input',
        message: `Upgrade ${connection.name} from API ${connection.api_version} to ${flags['target-version']}? Type the connection name to confirm`
      }])
      if (confirmed !== connection.name) {
        cli.error('Confirmation did not match. Aborting.')
        return
      }
    }

    const body = { target_version: flags['target-version'] }
    if (flags.force) body.force = true

    let response
    try {
      response = await cli.action(
        `Upgrading ${connection.name} to API ${flags['target-version']}`,
        api.request(context, 'POST', `/api/v3/connections/${connection.id}/actions/upgrade-api-version`, body)
      )
    } catch (err) {
      handleUpgradeError(err, flags)
      return
    }

    if (flags.json) {
      cli.styledJSON(response.data)
      return
    }

    cli.log()
    cli.log(cli.color.green(`Upgrade dispatched. ${connection.name} will run at Salesforce API ${response.data.target_version}.`))
    cli.log('Run `heroku connect:resume` when you are ready to resume sync.')
  }
}

function handleUpgradeError (err, flags) {
  const data = err && err.response && err.response.data
    ? err.response.data
    : (err && err.body ? err.body : null)
  if (!data) throw err

  if (data.dropped_field_mappings) {
    cli.error(
      'Cannot upgrade: some mappings reference fields that no longer exist at the target API version.\n' +
      formatMappingMap(data.dropped_field_mappings) +
      '\nEdit each mapping to remove the listed fields, then re-run.'
    )
    return
  }

  if (data.unsafe_mappings) {
    if (flags.force) {
      cli.error(`Upgrade refused unexpectedly with force=true: ${data.error || 'unknown reason'}`)
      return
    }
    cli.error(
      'Cannot upgrade: some mappings have unsafe field changes at the target API version.\n' +
      `Affected mappings: ${data.unsafe_mappings.join(', ')}\n` +
      'Re-run with --force to proceed anyway, or edit the mappings first.'
    )
    return
  }

  if (data.error) {
    cli.error(data.error)
    return
  }

  throw err
}

function formatMappingMap (mappingMap) {
  return Object.entries(mappingMap)
    .map(([name, fields]) => `  ${name}: ${fields.join(', ')}`)
    .join('\n')
}

function isValidApiVersion (value) {
  return /^\d{1,3}\.\d$/.test(value)
}
