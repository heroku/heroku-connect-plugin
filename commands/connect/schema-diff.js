'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('@heroku/heroku-cli-util')
const co = require('co')

function isFloat(value) {
    return !isNaN(value) && parseFloat(value) == value && !Number.isInteger(parseFloat(value));
  }

module.exports = {
    topic: 'connect',
    command: 'schema-diff',
    description: 'compares the version of schema of mappings in a connection ',
    help: 'compares the schema of mappings in a connection based on connection.api_version and a target_version, then returns possible differences between the two',
    args: [
        { name: 'target_version', required: false, description: 'The target api version to compare schema\'s with ' }
      ], 
    needsApp: true,
    needsAuth: true,
    run: cli.command(co.wrap(function * (context, heroku) {
      let connection, response, url
      connection = yield api.withConnection(context, heroku)
      url = '/api/v3/connections/' + connection.id + '/schema-diff'

      if (context.args.target_version) {
        const target_version = context.args.target_version;

      if (!isFloat(target_version)) {
        console.error('The provided argument is not a valid float number');
        process.exit(1);
      }
      
      url += `?target_version=${target_version}`;
      }
      yield cli.action('comparing schemas', co(function * () {
        
        context.region = connection.region_url
        
        response = yield api.request(context, 'GET', url)
        if (response) {
            console.log('Schema difference:', response.data);
          } else {
            console.error('Failed to process the request');
          }
      }))

    }))
  }
