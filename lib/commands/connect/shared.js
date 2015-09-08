var fs = require('fs');
var path = require('path');
var https = require('https');
var querystring = require('querystring');
var Q = require('q');
var Heroku = require('heroku-client');

var US_HOST = 'connect.heroku.com';
var EU_HOST = 'connect-eu.heroku.com';
var ADDON = 'herokuconnect';
var PORT = 443;
// Cache of EU apps. Cached on disk in ~/.heroku/connect
var eu_apps = {}
var need_to_read_cache = true;

var global_config = exports.global_config = function(context) {
  if (process.env['CONNECT_ADDON'] === 'connectqa') {
    var last_host = exports.HOST;
    exports.HOST = 'dev-herokuconnect.herokuapp.com';
    ADDON = 'connectqa';
    if (exports.HOST != last_host) {
      console.error("Using " + exports.HOST + "...");
    }
  }
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
    Authorization: 'Heroku ' + token
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

exports.withUser = function(token) {
  global_config();

  return request(token, 'GET', '/api/v3/users/me').then(function(response) {
    return Q.Promise(function(resolve, reject) {
      resolve(response.json.id);
    });
  }).catch(function(err) {
    reject(err);
  });
};

var withUserConnections = exports.withUserConnections = function(token, appName, flags, allowNone, heroku){
  global_config();

  var resource_name = null;
  if (flags && flags.resource) {
    resource_name = flags.resource;
  }
  //console.log("GET " + exports.HOST + "/api/v2/users/me", " heroku ", heroku);
  if (eu_apps[appName]) {
    exports.HOST = EU_HOST;
  }

  return request(token, 'GET', '/api/v2/users/me', {deep: true}).then(function(response){
      return Q.Promise(function(resolve, reject){
        var conns = response.json.connections;
        var connections = [];

        for (var i = 0, l = conns.length; i < l; i++) {
          if (conns[i].app_name === appName && 
            (resource_name === null || conns[i].resource_name.indexOf(resource_name) == 0)) {
            connections.push(conns[i]);
          }
        }

        if (connections.length == 0 && exports.HOST != EU_HOST && heroku) {
            return heroku.apps(appName).info(function (err, app) {
              if (err) {
                console.log(err);
                reject(err);
              } else if (app.region.name == 'eu') {
                eu_apps[appName] = true
                save_eu_apps();
                exports.HOST = 'connect-eu.heroku.com';
                withUserConnections(token, appName, flags, allowNone, heroku).then(function(connections) {
                  resolve(connections);
                });
              } else {
                exports.HOST = US_HOST;
                reject();
              }
            });
        } else {
          resolve(connections);
        } 
      });
  }).catch(function(err) {console.log(err)});
};

exports.withUserConnection = function(token, appName, connectionId){
  global_config();

  return withUserInstance(token, appName).then(function(instance){
    var connections = instance.connections;
    return Q.Promise(function(resolve, reject){
      for (var i = 0, l = connections.length; i < l; i++) {
        if (connections[i].id === connectionId) {
          resolve(connections[i]);
          return;
        }
      }
      console.log('Unable to find connection with ID #' + connectionId + ' for app "' + appName + '".');
      reject();
    });
  });
};

exports.withRequiredFields = function(token, connectionId, objectName){
  global_config();

  return request(token, 'GET', '/api/v2/connections/' + connectionId + '/schemas/' + objectName).then(function(response){
      var requiredFields = [];

      response.json.fields.forEach(function(field){
        if (field.required) {
          requiredFields.push(field.name);
        }
      });
      return requiredFields;
  });
};

exports.withConnectionMappings = function(token, connectionId) {
  global_config();

  return request(token, 'GET', '/api/v2/connections/' + connectionId + '/mappings').then(function(response){
      return Q.Promise(function(resolve, reject){
        if (response.statusCode === 200) {
          resolve(response.json.results);
        }
        else {
          console.log('Error retrieving mappings for connection.');
          printResponseError(response);
          reject(null);
        }
      });
  });
};

exports.requestAppAccess = function(token, app) {
  global_config();

  return exports.withUser(token).then(function(user_id) {
    console.log("Got user id ", user_id);
    var url = '/api/v3/users/' + user_id + '/apps/' + app + '/auth';
    console.log("POST ", url);
    return request(token, 'POST', url).then(function(response){
        return Q.Promise(function(resolve, reject){
          resolve(response.json);
        });
    });
  });
}
