var https = require('https');
var querystring = require('querystring');
var Q = require('q');

var HOST = 'connect.heroku.com';
var ADDON = 'herokuconnect';
var PORT = 443;

var global_config = exports.global_config = function(context) {
  if (process.env['CONNECT_ADDON'] === 'connectqa') {
    var last_host = HOST;
    HOST = 'dev-herokuconnect.herokuapp.com';
    ADDON = 'connectqa';
    if (HOST != last_host) {
      console.error("Using " + HOST + "...");
    }
  }
}

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

  var promise = Q.Promise(function(resolve, reject) {
    //console.log("HTTP (", token, "): ", HOST, path);
    var req = https.request({
      hostname: HOST,
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

var withUserConnections = exports.withUserConnections = function(token, appName, flags){
  global_config();

  var resource_name = null;
  if (flags && flags.resource) {
    resource_name = flags.resource;
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
        if (connections.length > 0) {
          resolve(connections);
        } else {
          console.log('Unable to find any connections on app "' + appName + '".');
          reject();
        }
      });
  });
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
