'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('@heroku/heroku-cli-util')
const co = require('co')
const http = require('http')

const LOCAL_PORT = 18000

function callbackServer () {
  return new Promise(function (resolve, reject) {
    // Create a local server that can receive the user after authoriztion is complete
    http.createServer(function (request, response) {
      // Notify the user that the the authorization is complete
      response.writeHead(200, { 'Content-Type': 'text/html' })
      const res = '<html><body><h3>Authorization complete</h3><p>You may close this window and return to the terminal to continue.</p></body></html>'
      response.end(res)

      // Shut down the server so the command can exit
      request.connection.destroy()
      this.close()

      // Return control to the main command
      resolve()
    }).listen(LOCAL_PORT)
  })
}

function * run (context, heroku) {
  let redir
  yield cli.action('fetching authorizing URL', co(function * () {
    const connection = yield api.withConnection(context, heroku, api.ADDON_TYPE_EVENTS)
    context.region = connection.region_url

    const url = `/api/v3/kafka-connections/${connection.id}/authorize_url`
    const args = {
      environment: 'production',
      // Redirect to the local server created in callbackServer(), so the CLI
      // can respond immediately after successful authorization
      next: `http://localhost:${LOCAL_PORT}`
    }

    if (context.flags.environment) {
      args.environment = context.flags.environment
    }

    if (context.flags.environment === 'custom' && context.flags.domain) {
      args.domain = context.flags.domain
    }

    const response = yield api.request(context, 'POST', url, args)
    redir = response.data.redirect

    yield cli.open(redir)
  }))

  cli.log("\nIf your browser doesn't open, please copy the following URL to proceed:\n" + redir + '\n')

  yield cli.action('waiting for authorization', callbackServer())
}

module.exports = {
  topic: 'connect-events',
  command: 'sf:auth',
  description: 'Authorize access to Salesforce for your connection',
  help: 'Opens a browser to authorize a connection to a Salesforce Org',
  flags: [
    { name: 'callback', char: 'c', description: 'final callback URL', hasValue: true },
    { name: 'environment', char: 'e', description: '"production", "sandbox", or "custom" [defaults to "production"]', hasValue: true },
    { name: 'domain', char: 'd', description: 'specify a custom login domain (if using a "custom" environment)', hasValue: true },
    { name: 'resource', description: 'specific connection resource name', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
