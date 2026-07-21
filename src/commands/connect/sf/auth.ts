import {Command, flags} from '@heroku-cli/command'
import {openUrl} from '@heroku/heroku-cli-util/hux'
import {ux} from '@oclif/core'
import http from 'node:http'

import {ConnectContext} from '../../../lib/clients/connect.js'
import * as api from '../../../lib/connect/api.js'

const LOCAL_PORT = 18_000

export function callbackServer(): Promise<void> {
  return new Promise<void>(resolve => {
    const server = http.createServer((request, response) => {
      response.writeHead(200, {'Content-Type': 'text/html'})
      const res = '<html><body><h3>Authorization complete</h3><p>You may close this window and return to the terminal to continue.</p></body></html>'
      response.end(res)

      request.socket.destroy()
      server.close()

      resolve()
    })
    server.listen(LOCAL_PORT)
  })
}

export default class SfAuth extends Command {
  static callbackServer = callbackServer
  static description = 'Authorize access to Salesforce for your connection'
  static flags = {
    app: flags.app({required: true}),
    callback: flags.string({char: 'c', description: 'final callback URL'}),
    domain: flags.string({char: 'd', description: 'specify a custom login domain (if using a "custom" environment)'}),
    environment: flags.string({char: 'e', description: '"production", "sandbox", or "custom" [defaults to "production"]'}),
    resource: flags.string({description: 'specific connection resource name'}),
  }
  static openUrl = openUrl

  async run(): Promise<void> {
    const {flags} = await this.parse(SfAuth)
    const context: ConnectContext = {
      app: flags.app,
      args: {},
      auth: {password: (await this.heroku.getAuth()) as string},
      flags,
    }

    ux.action.start('fetching authorizing URL')
    const connection = await api.withConnection(context)
    context.region = connection.region_url

    const url = `/api/v3/connections/${connection.id}/authorize_url`
    const requestArgs: Record<string, string> = {
      environment: 'production',
      next: `http://localhost:${LOCAL_PORT}`,
    }

    if (flags.environment) {
      requestArgs.environment = flags.environment
    }

    if (flags.environment === 'custom' && flags.domain) {
      requestArgs.domain = flags.domain
    }

    const response = await api.request(context, 'POST', url, requestArgs)
    const redir = response.data.redirect as string

    await SfAuth.openUrl(redir)
    ux.action.stop()

    ux.stdout(`\nIf your browser doesn't open, please copy the following URL to proceed:\n${redir}\n`)

    ux.action.start('waiting for authorization')
    await SfAuth.callbackServer()
    ux.action.stop()
  }
}
