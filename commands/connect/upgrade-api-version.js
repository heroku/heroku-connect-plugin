import { Command, flags } from '@heroku-cli/command'
import cli from '@heroku/heroku-cli-util'
import inquirer from 'inquirer'
import * as api from '../../lib/connect/api.js'
import { apiVersionFloor, isValidApiVersion } from '../../lib/connect/api-version.js'

export default class ConnectUpgradeApiVersion extends Command {
  static description = `upgrade a connection to a newer Salesforce API version

The connection must be paused before running this command. Run \`connect:schema-diff\` first to preview the changes. Downgrades are not supported.`

  static examples = [
    '$ heroku connect:pause --app my-app',
    '$ heroku connect:schema-diff --app my-app --target-version 61.0',
    '$ heroku connect:upgrade-api-version --app my-app --target-version 61.0',
    '$ heroku connect:upgrade-api-version --app my-app --target-version 61.0 --force',
    "$ heroku connect:upgrade-api-version --app my-app --target-version 61.0 --confirm 'my-app:fake-conn'"
  ]

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' }),
    'target-version': flags.string({ required: true, description: 'Salesforce API version to upgrade to (e.g. 61.0)' }),
    force: flags.boolean({ description: 'proceed even when mappings have unsafe changes (does not override dropped fields)' }),
    confirm: flags.string({ description: 'skip the interactive confirmation by passing the connection name' }),
    json: flags.boolean({ description: 'print output as json' })
  }

  async run () {
    const { flags: parsed } = await this.parse(ConnectUpgradeApiVersion)

    if (!isValidApiVersion(parsed['target-version'])) {
      this.error(
        `Invalid --target-version "${parsed['target-version']}". ` +
        'Salesforce API versions are of the form NN.0 (e.g. 61.0). ' +
        `Heroku Connect requires version >= ${apiVersionFloor()}.0.`,
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

    // Run client-side preconditions before prompting. Asking the customer
    // to type the connection name only to fail afterwards is a poor UX
    // (apps:destroy makes the same mistake).
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

    const confirmName = (parsed.confirm || '').trim()
    const nameMatches = confirmName.length > 0 && confirmName === connection.name

    if (!nameMatches) {
      // --json (and any non-interactive caller) MUST authorize via
      // --confirm; never let an output-format flag silently bypass the
      // destructive-action guard.
      if (parsed.json || !process.stdin.isTTY) {
        this.error(
          'Refusing to prompt in a non-interactive context. ' +
          `Re-run with --confirm '${connection.name}'.`,
          { exit: 1 }
        )
      }
      const { confirmed } = await inquirer.prompt([{
        name: 'confirmed',
        type: 'input',
        message: `Upgrade ${connection.name} from API ${connection.api_version} to ${parsed['target-version']}? Type the connection name to confirm`
      }])
      if ((confirmed || '').trim() !== connection.name) {
        this.error('Confirmation did not match. Aborting.', { exit: 1 })
      }
    }

    const body = { target_version: parsed['target-version'] }
    if (parsed.force) body.force = true

    let response
    try {
      response = await cli.action(
        `Upgrading ${connection.name} to API ${parsed['target-version']}`,
        (async () => api.request(context, 'POST', `/api/v3/connections/${connection.id}/actions/upgrade-api-version`, body))()
      )
    } catch (err) {
      handleUpgradeError(err, this, parsed, connection)
      return
    }

    if (parsed.json) {
      cli.styledJSON(response.data)
      return
    }

    const reportedVersion = (response.data && response.data.target_version) || parsed['target-version']
    cli.log()
    cli.log(cli.color.green(`Upgrade dispatched. ${connection.name} will run at Salesforce API ${reportedVersion}.`))
    cli.log('Run `heroku connect:resume` when you are ready to resume sync.')
  }
}

// Two response-shape branches: axios populates `err.response.data`,
// while the older heroku-client wrapper populates `err.body`. If neither
// is present (string body, network failure, etc.) we fall through to a
// generic message via cli.error rather than letting a raw axios error
// reach oclif's default handler.
function handleUpgradeError (err, cmd, flags, connection) {
  const data = err && err.response && err.response.data
    ? err.response.data
    : (err && err.body ? err.body : null)

  if (data && typeof data === 'object') {
    // Order is intentional: dropped fields cannot be bypassed by --force,
    // so we surface them first when both keys are present.
    if (data.dropped_field_mappings) {
      cmd.error(
        'Cannot upgrade: some mappings reference fields that no longer exist at the target API version.\n' +
        formatMappingMap(data.dropped_field_mappings) +
        '\nEdit each mapping to remove the listed fields, then re-run.',
        { exit: 1 }
      )
      return
    }

    if (data.unsafe_mappings) {
      if (flags.force) {
        cmd.error(
          `Upgrade was refused even with --force. Affected mappings: ${data.unsafe_mappings.join(', ')}.\n` +
          'Edit each mapping to remove the unsafe changes, or contact Heroku Support.',
          { exit: 1 }
        )
        return
      }
      cmd.error(
        'Cannot upgrade: some mappings have unsafe field changes at the target API version.\n' +
        `Affected mappings: ${data.unsafe_mappings.join(', ')}\n` +
        'Re-run with --force to proceed anyway, or edit the mappings first.',
        { exit: 1 }
      )
      return
    }

    if (data.error) {
      cmd.error(data.error, { exit: 1 })
      return
    }
  }

  // Unrecognized 4xx/5xx body: log a curated message rather than a raw
  // axios stack trace.
  const message = (err && err.message) ? err.message : 'unknown error'
  cmd.error(`Upgrade failed: ${message}`, { exit: 1 })
}

function formatMappingMap (mappingMap) {
  return Object.entries(mappingMap)
    .map(([name, fields]) => `  ${name}: ${fields.join(', ')}`)
    .join('\n')
}
