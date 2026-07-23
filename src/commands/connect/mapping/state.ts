import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import {ConnectContext} from '../../../lib/clients/connect.js'
import * as api from '../../../lib/connect/api.js'

export default class MappingState extends Command {
  static args = {
    mapping: Args.string({description: 'mapping name'}),
  }
  static description = 'Return a mapping state'
  static flags = {
    app: flags.app({required: true}),
    resource: flags.string({description: 'specific connection resource name'}),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(MappingState)
    const context: ConnectContext = {
      app: flags.app,
      args,
      auth: {password: (await this.heroku.getAuth()) as string},
      flags,
    }

    const connection = await api.withConnection(context)
    context.region = connection.region_url
    const mapping = await api.withMapping(connection, context.args.mapping as string | undefined)

    ux.stdout(mapping.state)
  }
}
