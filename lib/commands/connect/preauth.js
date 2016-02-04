'use strict';
var cli = require('heroku-cli-util');
var api = require('./shared.js');
var open = require('open');
var http = require('http');
var url = require('url');

function callbackServer() {
  var server = http.createServer(function (request, response) {
    var params = url.parse(request.url, true).query;
    response.writeHead(200, {"Content-Type": "text/html"});
    console.log("Preauth token: ", params.token);
    var res = "<html><body><h3>Token received: " + params.token + "</h3></body></html>";
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
    needsApp: false,
    needsAuth: true,
    run: function (context) {
      callbackServer();
      try {
        var args = {'next': 'http://127.0.0.1:18000'};
        if (context.flags.login) {
          args.login_url = context.flags.login;
        }
        api.request(context.auth.password, 
          'GET', '/api/v3/users/me/preauth', args).then(function(response) {
            open(response.json);
        });
      } catch (e) {console.log(e)};
    }
};
