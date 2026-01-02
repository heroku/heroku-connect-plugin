const axios = require('axios')

class ConnectClient {
  constructor (context) {
    this.client = axios.create({
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.auth.password}`,
        'Heroku-Client': 'cli'
      }
    })
  }

  getDetails (connection) {
    const detailUrl = connection.detail_url
    return this.client.get(`${detailUrl}?deep=true`)
  }

  request ({ baseURL, method, url, data }) {
    const config = {
      baseURL,
      method,
      url
    }
    
    // For GET requests, use params for query parameters
    // For other methods (POST, PUT, PATCH), use data for request body
    if (method.toUpperCase() === 'GET') {
      config.params = data
    } else {
      config.data = data
    }
    
    return this.client(config)
  }
}

exports.ConnectClient = ConnectClient
