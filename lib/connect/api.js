'use strict'
const cli = require('heroku-cli-util')
const co = require('co')
const https = require('https')
const querystring = require('querystring')

const regions = require('./regions.js')

let US_HOST = regions.prodRegionsMap.virginia
let EU_HOST = regions.prodRegionsMap.dublin
if (process.env['CONNECT_ADDON'] === 'connectqa') {
  US_HOST = regions.qaRegionsMap.virginia
  EU_HOST = regions.qaRegionsMap.dublin
}
let PORT = 443

exports.HOST = US_HOST

exports.printResponseError = function (response) {
  console.log('Status code = ', response.statusCode, 'body = ', response.json)
}

let request = exports.request = function (context, method, path, data) {
  let withBody = false
  let headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + context.auth.password,
    'Heroku-Client': 'toolbelt'
  }

  // add data as querystring for GET request
  if (data !== undefined && method === 'GET') {
    path += ('?' + querystring.stringify(data))
  }
  // add data to body for POST/PUT requests
  if (data !== undefined && ['POST', 'PUT', 'PATCH'].indexOf(method) !== -1) {
    withBody = true
    data = JSON.stringify(data)
    headers['Content-Length'] = data.length
  }

  let hostname = regions.urlFromRegion(context.region)

  let promise = new Promise(function (resolve, reject) {
    let req = https.request({
      hostname: hostname,
      port: PORT,
      path: path,
      method: method,
      headers: headers
    }, function (res) {
      let body = ''

      res.setEncoding('utf8')
      res.on('data', function (chunk) {
        body += chunk
      })

      res.on('end', function () {
        // can only resolve with one argument, add json data to response object
        try {
          res.json = JSON.parse(body)
        } catch (e) {
          // body is empty, like with a DELETE, or invalid json
          res.json = null
          res.text = body
        }
        if (res.statusCode >= 400) {
          let message = res.json ? res.json['message'] : res.statusCode + ' ' + res.statusMessage + ': ' + res.text
          reject(new Error(message))
        } else {
          resolve(res)
        }
      })
    })

    req.on('error', function (err) {
      console.log('Request error', err)
      reject(err)
    })

    // add data to body for POST/PUT requests
    if (withBody) {
      req.write(data)
    }
    req.end()
  })

  return promise
}

let withUserConnections = exports.withUserConnections = co.wrap(function * (context, appName, flags, allowNone, heroku) {
  // global_config();

  if (flags && flags.resource) {
    cli.hush('Calling Platform API for resource id')

    return co(function * () {
      let addon
      try {
        addon = yield heroku.apps(appName).addons(flags.resource).info()
      } catch (err) {
        if (err.statusCode === 404) {
          err.body.message = "Connection with resource name '" + flags.resource + "' not found"
        }
        throw err
      }
      flags.resource_id = addon.id
      delete flags['resource']
      return yield Promise.resolve(withUserConnections(context, appName, flags, allowNone, heroku))
    })
  }

  cli.hush('Retrieving user connections')
  let response = yield request(context, 'GET', '/api/v3/connections', {deep: true, app: appName, resource_id: flags.resource_id})
  return co(function * () {
    let connections = response.json.results

    if (connections.length === 0 && exports.HOST !== EU_HOST && heroku) {
      // Nothing found in the US, check again in the EU
      let app = yield heroku.apps(appName).info()

      if (app.region.name === 'eu') {
        let connections = yield withUserConnections(context, appName, flags, allowNone, heroku)
        return yield Promise.resolve(connections)
      } else {
        exports.HOST = US_HOST
        return yield Promise.resolve(connections)
      }
    } else {
      return yield Promise.resolve(connections)
    }
  })
})

exports.withConnection = function (context, heroku) {
  return co(function * () {
    let connections = yield withUserConnections(context, context.app, context.flags, true, heroku)
    console.log('in withConnection:', connections)
    if (connections.length === 0) {
      yield Promise.reject(Error('No connection(s) found'))
    } else if (connections.length > 1) {
      throw new Error("Multiple connections found. Please use '--resource' to specify a single connection by resource name.")
    } else {
      return yield Promise.resolve(connections[0])
    }
  })
}

exports.withMapping = function (connection, objectName) {
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
  console.log(exports.connection_string(conn) + ' (' + conn.state + ')')
  if (showMappings) {
    conn.mappings.forEach(function (mapping) {
      console.log('--> ' + mapping.object_name + ' (' + mapping.state + ')')
    })
  }
}
