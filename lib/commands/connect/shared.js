var https = require('https');
var querystring = require('querystring');
var Q = require('q');

var HOST = 'dev-herokuconnect.herokuapp.com';
var PORT = 443;


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
  if (data !== undefined && ['POST', 'PUT'].indexOf(method) !== -1) {
    withBody = true;
    data = JSON.stringify(data);
    headers['Content-Length'] = data.length;
  }

  var promise = Q.Promise(function(resolve, reject) {
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

var withUserInstance = exports.withUserInstance = function(token, appName){
  return request(token, 'GET', '/api/v2/users/me', {deep: true}).then(function(response){
      return Q.Promise(function(resolve, reject){
        var instances = response.json.instances;
        for (var i = 0, l = instances.length; i < l; i++) {
          if (instances[i].name === appName) {
            resolve(instances[i]);
            return;
          }
        }
        console.log('Unable to find instance matching app "' + appName + '".');
        reject();
      });
  });
};

exports.withUserConnection = function(token, appName, connectionId){
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
