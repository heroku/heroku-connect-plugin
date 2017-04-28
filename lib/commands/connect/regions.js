'use strict'
const cli = require('heroku-cli-util')

const prodRegions = ['us', 'eu', 'tokyo', 'virginia', 'oregon', 'frankfurt', 'sydney']
const prodRegionsMap = {}
const qaRegions = ['dublin', 'frankfurt', 'virginia']
const qaRegionsMap = {}
prodRegions.forEach(region => {
  prodRegionsMap[region] = `connect-${region}.heroku.com`
})
qaRegions.forEach(region => {
  qaRegionsMap[region] = `hc-qa-${region}.herokai.com`
})

exports.prodRegions = prodRegions
exports.prodRegionsMap = prodRegionsMap
exports.flag = {
  name: 'region',
  description: 'region of Heroku Connect to work with',
  hasValue: true
}

let determineRegion = exports.determineRegion = function (context) {
  let connectRegion
  let appRegion = context.app.region
  if (!(prodRegions.includes(appRegion) || context.flags.region)) {
    cli.exit(1, `Please specify a --region in which you're using Heroku Connect.
Valid regions: ${prodRegions.join(', ')}`)
  }

  // The --region flag should override the region set on the App.
  if (context.flags.region) {
    if (!prodRegions.includes(context.flags.region)) {
      cli.exit(1, `Expected --region to be one of: ${prodRegions.join(', ')}`)
    }
    connectRegion = context.flags.region
  } else if (prodRegions.includes(appRegion)) {
    connectRegion = appRegion
  }
  return connectRegion
}

let urlFromRegion = exports.urlFromRegion = regionName => prodRegionsMap[regionName]

let requireRegion = exports.requireRegion = function (fn) {
  return (context, heroku) => {
    context.region = determineRegion(context)
    return fn(context, heroku)
  }
}
