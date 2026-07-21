import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as fs from 'node:fs'

import {ConnectContext} from '../../lib/clients/connect.js'
import * as api from '../../lib/connect/api.js'

export default class ConnectImport extends Command {
  static args = {
    file: Args.string({description: 'JSON export file name'}),
  }
  static description = 'Import configuration from an export file'
  static flags = {
    app: flags.app({required: true}),
    resource: flags.string({description: 'specific connection resource name'}),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(ConnectImport)
    const context: ConnectContext = {
      app: flags.app,
      args,
      auth: {password: (await this.heroku.getAuth()) as string},
      flags,
    }

    const fName = args.file as string
    ux.action.start(`uploading ${fName}`)
    const connection = await api.withConnection(context)
    context.region = connection.region_url
    const url = `/api/v3/connections/${connection.id}/actions/import`
    const data = JSON.parse(fs.readFileSync(fName, 'utf8'))
    await api.request(context, 'POST', url, data)
    ux.action.stop()
  }
}
