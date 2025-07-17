import {flags, Command} from '@heroku-cli/command'
import {withConnection, getWriteErrors} from '../../lib/api'

export default class WriteErrors extends Command {
  static description = 'display the last 24 hours of write errors on this connection'
  static examples = [
    'heroku connect:write-errors -a myapp --resource herokuconnect-twisted-123',
  ]

  static flags = {
    app: flags.app({description: 'app to run command against', required: true}),
    resource: flags.string({description: 'specific connection resource name'}),
    json: flags.boolean({description: 'print errors as styled JSON'}),
    remote: flags.remote({description: 'git remote of target app'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(WriteErrors)
    const {app: appName, resource: resourceName, json} = flags
    const connection = await withConnection(this.heroku, appName, resourceName)

    await getWriteErrors(this.heroku, connection, undefined, json)
  }
}
