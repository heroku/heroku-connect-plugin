'use strict';
let cli = require('heroku-cli-util');
let api = require('./shared.js');
let open = require('open');
let http = require('http');
let url = require('url');

function callbackServer() {
  let server = http.createServer(function (request, response) {
    let params = url.parse(request.url, true).query;
    response.writeHead(200, {"Content-Type": "text/html"});
    console.log("Preauth token: ", params.token);
    let res = "<html><body><h3>Token received: " + params.token + "</h3></body></html>";
    response.end(res);
    process.exit();
  });
  server.listen(18000);
}

module.exports = {
    topic: 'connect',
    command: 'preauth',
    description: 'get pre-authorization URL',
    help: 'return an URL to preauthorize Connect to an SF Org',
    flags: [
       {name: 'callback', char: 'c', description: 'final callback URL', hasValue: true},
       {name: 'login', char: 'l', description: 'alternate Salesforce login URL', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: function (context) {
      callbackServer();
      api.withUser(context.auth.password).then(function(user_id) {
        try {
          let args = {'next': 'http://127.0.0.1:18000'};
          if (context.flags.login) {
            args.login_url = context.flags.login;
          }
          api.request(context.auth.password, 
            'GET', '/api/v3/users/' + user_id + '/preauth', args).then(function(response) {
              open(response.json);
          });
        } catch (e) {console.log(e)};
      });
    }
};
