import {Command, flags} from '@heroku-cli/command'
import {confirmCommand} from '@heroku/heroku-cli-util/hux'
import {Args, ux} from '@oclif/core'

import {ConnectContext} from '../../../lib/clients/connect.js'
import * as api from '../../../lib/connect/api.js'

export default class MappingDelete extends Command {
  static args = {
    mapping: Args.string({description: 'mapping name'}),
  }
  static description = 'Delete an existing mapping'
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({description: 'app name to confirm deletion'}),
    resource: flags.string({description: 'specific connection resource name'}),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(MappingDelete)
    const context: ConnectContext = {
      app: flags.app,
      args,
      auth: {password: (await this.heroku.getAuth()) as string},
      flags,
    }

    await confirmCommand({comparison: flags.app, confirmation: flags.confirm})

    ux.action.start('deleting mapping')
    const connection = await api.withConnection(context)
    context.region = connection.region_url
    const mapping = await api.withMapping(connection, context.args.mapping as string | undefined)
    const response = await api.request(context, 'DELETE', `/api/v3/mappings/${mapping.id}`)
    if (response.status !== 204) {
      throw new Error(response.data.message || 'unknown error')
    }

    ux.action.stop()
  }
}
