'use strict'
const cli = require('heroku-cli-util')
const co = require('co')
const axios = require('axios')

function makeConnectClient (context) {
  return axios.create({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${context.auth.password}`,
      'Heroku-Client': 'cli'
    }
  })
}

function makeDiscoveryClient (context) {
  return axios.create({
    baseURL: 'https://hc-central-qa.herokai.com',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${context.auth.password}`,
      'Heroku-Client': 'cli'
    }
  })
}

const regions = require('./regions.js')

exports.printResponseError = function (response) {
  console.log('Status code = ', response.statusCode, 'body = ', response.json)
}

let request = exports.request = function (context, method, url, data) {
  if (!context.region) {
    throw new Error('Must provide region URL')
  }
  const connectClient = makeConnectClient(context)
  return connectClient({
    baseURL: context.region,
    method,
    url,
    data
  })
}

let withUserConnections = exports.withUserConnections = co.wrap(function * (context, appName, flags, allowNone, heroku) {
  const discoveryClient = makeDiscoveryClient(context)
  const connectClient = makeConnectClient(context)
  const resourceFlag = context.flags.resource
  const resourceFlagQueryParam = resourceFlag ? `&resource_name=${resourceFlag}` : ''

  const response = yield discoveryClient(`/connections?app=${appName}${resourceFlagQueryParam}`)
  const connections = response.data.results

  if (connections.length === 0) {
    return yield Promise.resolve([])
  }

  const fetchConnectionDetailFuncs = connections.map(c => connectClient.get(`${c.detail_url}?deep=true`))

  const aggregatedConnectionsResponse = yield Promise.all(fetchConnectionDetailFuncs)
  const aggregatedConnectionsData = aggregatedConnectionsResponse.map(resp => {
    return {
      ...resp.data,
      ...connections.find(c => c.id === resp.data.id)
    }
  })
  return yield Promise.resolve(aggregatedConnectionsData)
})

let withConnection = exports.withConnection = function (context, heroku) {
  return co(function * () {
    let connections = yield withUserConnections(context, context.app, context.flags, true, heroku)
    if (connections.length === 0) {
      yield Promise.reject(Error('No connection(s) found'))
    } else if (connections.length > 1) {
      throw new Error("Multiple connections found. Please use '--resource' to specify a single connection by resource name. Use 'connect:info' to list the resource names.")
    } else {
      return yield Promise.resolve(connections[0])
    }
  })
}

let withMapping = exports.withMapping = function (connection, objectName) {
  return co(function * () {
    let objectNameLower = objectName.toLowerCase()
    let mapping
    connection.mappings.forEach(function (m) {
      if (m.object_name.toLowerCase().indexOf(objectNameLower) === 0) {
        mapping = m
      }
    })
    if (mapping !== undefined) {
      return yield Promise.resolve(mapping)
    } else {
      throw new Error('No mapping configured for ' + objectName)
    }
  })
}

// USED by create-mapping
exports.withRequiredFields = function (context, connectionId, objectName) {
  // global_config();

  return request(context, 'GET', '/api/v3/connections/' + connectionId + '/schemas/' + objectName).then(function (response) {
    let requiredFields = []

    response.json.fields.forEach(function (field) {
      if (field.required) {
        requiredFields.push(field.name)
      }
    })
    return requiredFields
  })
}

exports.getWriteErrors = co.wrap(function * (context, heroku) {
  context.region = yield regions.determineRegion(context, heroku)
  let url, action
  let mappingName = context.args.name
  let connection = yield withConnection(context, heroku)
  if (!mappingName) {
    url = `/api/v3/connections/${connection.id}/errors`
    action = `Retrieving write errors for ${connection.name}`
  } else {
    let mapping = yield withMapping(connection, mappingName)
    url = `/api/v3/mappings/${mapping.id}/errors`
    action = `Retrieving write errors for ${mappingName} on ${connection.name}`
  }
  let results = yield cli.action(action, co(function * () {
    return yield request(context, 'GET', url)
  }))
  let errors = results.json

  if (errors.count === 0) {
    cli.log(cli.color.green('No write errors in the last 24 hours'))
  } else {
    if (context.flags.json) {
      cli.styledJSON(errors.results)
    } else {
      cli.table(errors.results, {
        columns: [
          {key: 'id', label: 'Trigger Log ID'},
          {key: 'table_name', label: 'Table Name'},
          {key: 'record_id', label: 'Table ID'},
          {key: 'message', label: 'Error Message'},
          {key: 'created_at', label: 'Created'}
        ]
      })
    }
  }
})

exports.requestAppAccess = co.wrap(function * (context, app) {
  // global_config();

  let url = '/api/v3/users/me/apps/' + app + '/auth'
  cli.hush('POST ', url)
  let response = yield request(context, 'POST', url)
  return yield Promise.resolve(response.json)
})

exports.connection_string = function (conn) {
  return 'Connection [' + conn.id + ' / ' + conn.resource_name + ']'
}

exports.connection_info = function (conn, showMappings) {
  if (conn.length) {
    for (let i = 0; i < conn.length; i++) {
      exports.connection_info(conn[i], showMappings)
    }
    return
  }
  cli.log(exports.connection_string(conn) + ' (' + conn.state + ')')
  if (showMappings) {
    conn.mappings.forEach(function (mapping) {
      cli.log('--> ' + mapping.object_name + ' (' + mapping.state + ')')
    })
  }
  cli.log('') // newline after each connection
}
