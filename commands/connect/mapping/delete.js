import * as api from '../../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'
import { Command, flags } from '@heroku-cli/command'
import { Args } from '@oclif/core'

export default class MappingDelete extends Command {
  static description = 'Delete an existing mapping'

  static args = {
    mapping: Args.string({ description: 'mapping name' })
  }

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' }),
    confirm: flags.string({ description: 'app name to confirm deletion' })
  }

  async run () {
    const { args, flags } = await this.parse(MappingDelete)
    const context = { app: flags.app, flags, args, auth: { password: this.heroku.auth } }

    await cli.confirmApp(flags.app, flags.confirm)

    await cli.action('deleting mapping', (async function () {
      const connection = await api.withConnection(context, this.heroku)
      context.region = connection.region_url
      const mapping = await api.withMapping(connection, context.args.mapping)
      const response = await api.request(context, 'DELETE', '/api/v3/mappings/' + mapping.id)
      if (response.status !== 204) {
        throw new Error(response.data.message || 'unknown error')
      }
    }.bind(this))())
  }
}
