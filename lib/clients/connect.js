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
    return this.client({
      baseURL,
      method,
      url,
      data
    })
  }
}

exports.ConnectClient = ConnectClient
