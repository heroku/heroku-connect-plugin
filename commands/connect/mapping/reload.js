import * as api from '../../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'
import { Command, flags } from '@heroku-cli/command'
import { Args } from '@oclif/core'

export default class MappingReload extends Command {
  static description = "Reload a mapping's data from Salesforce"

  static args = {
    mapping: Args.string({ description: 'mapping name' })
  }

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' })
  }

  async run () {
    const { args, flags } = await this.parse(MappingReload)
    const context = { app: flags.app, flags, args, auth: { password: this.heroku.auth } }

    await cli.action(`initiating reload of ${args.mapping}`, (async function () {
      const connection = await api.withConnection(context, this.heroku)
      context.region = connection.region_url
      const mapping = await api.withMapping(connection, context.args.mapping)

      const response = await api.request(context, 'POST', '/api/v3/mappings/' + mapping.id + '/actions/reload')
      if (response.status !== 202) {
        throw new Error(response.data.message || 'unknown error')
      }
    }.bind(this))())
  }
}
