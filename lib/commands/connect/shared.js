'use strict';
let cli = require('heroku-cli-util');
let co = require('co');
let fs = require('fs');
let path = require('path');
let https = require('https');
let querystring = require('querystring');
let Heroku = require('heroku-client');

let US_HOST = 'connect-us.heroku.com';
let EU_HOST = 'connect-eu.heroku.com';
if (process.env['CONNECT_ADDON'] == 'connectqa') {
  US_HOST = 'dev-herokuconnect.herokuapp.com';
  EU_HOST = 'hc-qa-frankfurt.herokai.com';
}
let PORT = 443;
// Cache of EU apps. Cached on disk in ~/.heroku/connect
let eu_apps = {}
let need_to_read_cache = true;

let global_config = exports.global_config = function(context) {
  if (need_to_read_cache) {
    need_to_read_cache = false;
    let p = path.join(process.env.HOME, '.heroku', 'connect');
    if (fs.existsSync(p)) {
      let contents = fs.readFileSync(p, 'utf8');
      eu_apps = JSON.parse(contents);
    }
  }
}

let save_eu_apps = function() {
  fs.writeFile(path.join(process.env.HOME, '.heroku', 'connect'), JSON.stringify(eu_apps), 'utf8');
}

exports.HOST = US_HOST;

let printResponseError = exports.printResponseError = function(response){
  console.log('Status code = ', response.statusCode, 'body = ', response.json);
};

let request = exports.request = function(token, method, path, data){
  let withBody = false;
  let headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token,
    'Heroku-Client': 'toolbelt',
  };

  // add data as querystring for GET request
  if (data !== undefined && method === 'GET') {
    path += ('?' + querystring.stringify(data));
  }
  // add data to body for POST/PUT requests
  if (data !== undefined && ['POST', 'PUT', 'PATCH'].indexOf(method) !== -1) {
    withBody = true;
    data = JSON.stringify(data);
    headers['Content-Length'] = data.length;
  }

  //console.log(method, exports.HOST, path);

  let promise = new Promise(function(resolve, reject) {
    let req = https.request({
      hostname: exports.HOST,
      port: PORT,
      path: path,
      method: method,
      headers: headers
    }, function(res) {
      let body = '';

      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        body += chunk;
      });

      res.on('end', function() {
        // can only resolve with one argument, add json data to response object
        try {
          res.json = JSON.parse(body);
        }
        catch (e) {
          // body is empty, like with a DELETE, or invalid json
          res.json = null;
          res.text = body;
        }
        if (res.statusCode >= 400) {
          reject(new Error(res.json['message']));
        } else {
          resolve(res);
        }
      });
    });

    req.on('error', function(err){
      console.log('Request error', err);
      reject(err);
    });

    // add data to body for POST/PUT requests
    if (withBody) {
      req.write(data);
    }
    req.end();
  });



  return promise;
};

let withUserConnections = exports.withUserConnections = co.wrap(function* (token, appName, flags, allowNone, heroku){
  global_config();

  let resource_id = null;
  if (flags && flags.resource) {
    cli.hush("Calling Platform API for resource id");

    return co(function* () {
      let addon;
      try {
        addon = yield heroku.apps(appName).addons(flags.resource).info();
      } catch(err) {
        if (err.statusCode === 404) {
          err.body.message = "Connection with resource name '" + flags.resource + "' not found";
        }
        throw err;
      }
      flags.resource_id = addon.id;
      delete flags['resource'];
      return yield Promise.resolve(withUserConnections(token, appName, flags, allowNone, heroku));
    });
  }
  if (eu_apps[appName]) {
    exports.HOST = EU_HOST;
  }

  let response = yield request(token, 'GET', '/api/v3/connections', {deep:true, app: appName, resource_id: flags.resource_id});
  return co(function* () {
    let connections = response.json.results;

    if (connections.length == 0 && exports.HOST != EU_HOST && heroku) {
      // Nothing found in the US, check again in the EU
      let app = yield heroku.apps(appName).info();

      if (app.region.name == 'eu') {
        eu_apps[appName] = true
        save_eu_apps();
        exports.HOST = EU_HOST;
        let connections = yield withUserConnections(token, appName, flags, allowNone, heroku);
        return yield Promise.resolve(connections);
      } else {
        exports.HOST = US_HOST;
        return yield Promise.resolve(connections);
      }
    } else {
      return yield Promise.resolve(connections);
    }
  });
});

exports.withConnection = function(context, heroku) {
  return co(function* () {
    let connections = yield withUserConnections(context.auth.password, context.app, context.flags, true, heroku);
    if (connections.length == 0) {
      yield Promise.reject('No connection(s) found');
    } else if (connections.length > 1) {
      throw new Error("Multiple connections found. Please use '--resource' to specify a single connection by resource name.");
    } else {
      return yield Promise.resolve(connections[0]);
    }
  });
}

let withMapping = exports.withMapping = function(connection, object_name) {
  return co(function* () {
    let object_name_lower = object_name.toLowerCase();
    let mapping = undefined;
    connection.mappings.forEach(function (m) {
      if (m.object_name.toLowerCase().indexOf(object_name_lower) == 0) {
        mapping = m;
      }
    });
    if (mapping != undefined) {
      return yield Promise.resolve(mapping);
    } else {
      throw new Error('No mapping configured for ' + object_name);
    }
  });
};

// USED by create-mapping
exports.withRequiredFields = function(token, connectionId, objectName){
  global_config();

  return request(token, 'GET', '/api/v3/connections/' + connectionId + '/schemas/' + objectName).then(function(response){
      let requiredFields = [];

      response.json.fields.forEach(function(field){
        if (field.required) {
          requiredFields.push(field.name);
        }
      });
      return requiredFields;
  });
};

exports.requestAppAccess = co.wrap(function* (token, app) {
  global_config();

  let url = '/api/v3/users/me/apps/' + app + '/auth';
  cli.hush("POST ", url);
  let response = yield request(token, 'POST', url);
  return yield Promise.resolve(response.json);
});

exports.connection_string = function(conn) {
  return 'Connection [' + conn.id + ' / ' + conn.resource_name + ']';
}

exports.connection_info = function(conn, show_mappings) {
  if (conn.length) {
    for (let i = 0; i < conn.length; i++) {
      exports.connection_info(conn[i], show_mappings);
    }
    return;
  }
  console.log(exports.connection_string(conn) + ' (' + conn.state + ')');
  if (show_mappings) {
    conn.mappings.forEach(function(mapping) {
      console.log('--> ' + mapping.object_name + ' (' + mapping.state + ')');
    });
  }
}


