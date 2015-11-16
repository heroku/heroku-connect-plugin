var fs = require('fs');
var path = require('path');
var https = require('https');
var querystring = require('querystring');
var Q = require('q');
var Heroku = require('heroku-client');

var US_HOST = 'connect.heroku.com';
var EU_HOST = 'connect-eu.heroku.com';
var ADDON = 'herokuconnect';
if (process.env['CONNECT_ADDON'] == 'connectqa') {
  ADDON = 'connectqa';
  console.error("Using " + ADDON + "...");
  US_HOST = 'dev-herokuconnect.herokuapp.com';
  EU_HOST = 'dev-herokuconnect-eu.herokuapp.com';
}
var PORT = 443;
// Cache of EU apps. Cached on disk in ~/.heroku/connect
var eu_apps = {}
var need_to_read_cache = true;

var global_config = exports.global_config = function(context) {
  if (need_to_read_cache) {
    need_to_read_cache = false;
    var p = path.join(process.env.HOME, '.heroku', 'connect');
    if (fs.existsSync(p)) {
      contents = fs.readFileSync(p, 'utf8');
      eu_apps = JSON.parse(contents);
    }
  }
}

var save_eu_apps = function() {
  fs.writeFile(path.join(process.env.HOME, '.heroku', 'connect'), JSON.stringify(eu_apps), 'utf8');
}

exports.HOST = US_HOST;

var printResponseError = exports.printResponseError = function(response){
  console.log('Status code = ', response.statusCode, 'body = ', response.json);
};

var request = exports.request = function(token, method, path, data){
  var withBody = false;
  var headers = {
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

  var promise = Q.Promise(function(resolve, reject) {
    var req = https.request({
      hostname: exports.HOST,
      port: PORT,
      path: path,
      method: method,
      headers: headers
    }, function(res) {
      var body = '';

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

        resolve(res);
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

var withUserConnections = exports.withUserConnections = function(token, appName, flags, allowNone, heroku){
  global_config();

  var resource_id = null;
  if (flags && flags.resource) {
    console.log("Calling Platform API for resouce id");
    return Q.Promise(function(resolve, reject) {
      return heroku.apps(appName).addons(flags.resource).info(function(err, addon) {
        if(err) {
          if (err.statusCode === 404) {
            console.log("Connection with resource name '" + flags.resource + "' not found");
            reject();
          } else {
            console.log(err);
            reject(err);
          }
        } else {
          flags.resource_id = addon.id;
          delete flags['resource'];
          withUserConnections(token, appName, flags, allowNone, heroku).then(resolve);
        }
      });

    });
  }
  if (eu_apps[appName]) {
    exports.HOST = EU_HOST;
  }

  return request(token, 'GET', '/api/v3/connections', {deep:true, app: appName, resource_id: flags.resource_id}).then(function(response){
      return Q.Promise(function(resolve, reject){
        var connections = response.json.results;

        if (connections.length == 0 && exports.HOST != EU_HOST && heroku) {
            return heroku.apps(appName).info(function (err, app) {
              if (err) {
                console.log(err);
                reject(err);
              } else if (app.region.name == 'eu') {
                eu_apps[appName] = true
                save_eu_apps();
                exports.HOST = EU_HOST;
                withUserConnections(token, appName, flags, allowNone, heroku).then(function(connections) {
                  resolve(connections);
                });
              } else {
                exports.HOST = US_HOST;
                resolve(connections);
              }
            });
        } else {
          resolve(connections);
        } 
      });
  }).catch(function(err) {console.log(err)});
};

exports.withConnection = function(context, heroku) {
  return Q.Promise(function(resolve, reject) {
    exports.withUserConnections(context.auth.password, context.app, context.flags, true, heroku).then(function(connections) {
      if (connections.length == 0) {
        console.log("No connection found");
        reject();
      } else if (connections.length > 1) {
        console.log("Multiple connections found");
        exports.connection_info(connections);
        reject();
      } else {
        resolve(connections[0]);
      }
    });
  });
}

// USED by create-mapping
exports.withRequiredFields = function(token, connectionId, objectName){
  global_config();

  return request(token, 'GET', '/api/v3/connections/' + connectionId + '/schemas/' + objectName).then(function(response){
      var requiredFields = [];

      response.json.fields.forEach(function(field){
        if (field.required) {
          requiredFields.push(field.name);
        }
      });
      return requiredFields;
  });
};

exports.requestAppAccess = function(token, app) {
  global_config();

  var url = '/api/v3/users/me/apps/' + app + '/auth';
  console.log("POST ", url);
  return request(token, 'POST', url).then(function(response){
      return Q.Promise(function(resolve, reject){
        resolve(response.json);
      });
  });
}

exports.connection_info = function(conn, show_mappings) {
    if (conn.length) {
      for (var i = 0; i < conn.length; i++) {
        exports.connection_info(conn[i], show_mappings);
      }
      return;
    }
    console.log('Connection [' + conn.id + ' / ' + conn.resource_name + '] ' + '(' + conn.state + ')');
    if (show_mappings) {
      conn.mappings.forEach(function(mapping) {
        console.log('--> ' + mapping.object_name + ' (' + mapping.state + ')');
      });
    }
}


