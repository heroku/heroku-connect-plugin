'use strict'
const api = require('../../lib/connect/api.js')
const regions = require('../../lib/connect/regions.js')
const cli = require('heroku-cli-util')
const co = require('co')
const http = require('http')

const LOCAL_PORT = 18000

function callbackServer () {
  return new Promise(function (resolve, reject) {
    // Create a local server that can receive the user after authoriztion is complete
    http.createServer(function (request, response) {
      // Notify the user that the the authorization is complete
      response.writeHead(200, {'Content-Type': 'text/html'})
      let res = '<html><body><h3>Authorization complete</h3><p>You may close this window and return to the terminal to continue.</p></body></html>'
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
	context.region = regions.determineRegion(context)
	let redir

	yield cli.action('fetching authorizing URL', co(function * () {
		let connection = yield api.withConnection(context, heroku)

		let url = '/api/v3/connections/' + connection.id + '/authorize_url'
		let args = {
			'environment': 'production',
			// Redirect to the local server created in callbackServer(), so the CLI
			// can respond immediately after successful authorization
			'next': `http://localhost:${LOCAL_PORT}`
		}
		if (context.flags.login) {
			args.login_url = context.flags.login
		}

		let response = yield api.request(context, 'POST', url, args)
		redir = response.json.redirect

		yield cli.open(redir)
	}))

	cli.log("\nIf your browser doesn't open, please copy the following URL to proceed:\n" + redir + '\n')

	yield cli.action('waiting for authorization', callbackServer())
}

module.exports = {
  topic: 'connect',
  command: 'sf:auth',
  description: 'Authorize access to Salesforce for your connection',
  help: 'Opens a browser to authorize a connection to a Salesforce Org',
  flags: [
    {name: 'callback', char: 'c', description: 'final callback URL', hasValue: true},
    {name: 'login', char: 'l', description: 'alternate Salesforce login URL', hasValue: true},
    {name: 'resource', description: 'specific connection resource name', hasValue: true},
    regions.flag
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
