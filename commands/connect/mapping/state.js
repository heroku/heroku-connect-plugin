import * as api from '../../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'
import { Command, flags } from '@heroku-cli/command'
import { Args } from '@oclif/core'

export default class MappingState extends Command {
  static description = 'return a mapping state'

  static args = {
    mapping: Args.string({ description: 'mapping name' })
  }

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' })
  }

  async run () {
    const { args, flags } = await this.parse(MappingState)
    const context = { app: flags.app, flags, args, auth: { password: this.heroku.auth } }

    const connection = await api.withConnection(context, this.heroku)
    context.region = connection.region_url
    const mapping = await api.withMapping(connection, context.args.mapping)

    cli.log(mapping.state)
  }
}
