import { Command, flags, Args } from '@heroku-cli/command'
import cli from '@heroku/heroku-cli-util'
import * as api from '../../lib/connect/api.js'
import fs from 'fs'

export default class ConnectImport extends Command {
  static description = 'Import configuration from an export file'

  static args = {
    file: Args.string({ description: 'JSON export file name' })
  }

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' })
  }

  async run () {
    const { args, flags } = await this.parse(ConnectImport)
    const context = {
      app: flags.app,
      flags,
      args,
      auth: { password: this.heroku.auth }
    }

    const fName = args.file
    await cli.action(`uploading ${fName}`, (async function () {
      const connection = await api.withConnection(context, this.heroku)
      context.region = connection.region_url
      const url = '/api/v3/connections/' + connection.id + '/actions/import'
      const data = JSON.parse(fs.readFileSync(fName, 'utf8'))
      await api.request(context, 'POST', url, data)
    }.bind(this))())
  }
}
