const { isRitual, SCHEMA_VERSION } = require('ssb-dark-crystal-schema')
const tool = 'secrets.js-grempe'
const toolVersion = require('../../package.json').dependencies[tool]

module.exports = function (server) {
  return function publish (params, callback) {
    const { root, shards, quorum } = params
    var content = {
      type: 'dark-crystal/ritual',
      version: SCHEMA_VERSION,
      root,
      shards,
      quorum,
      tool: `${tool}@${toolVersion}`,
      recps: [server.id]
    }

    // TODO - this is likely publishing publicly!!!!
    // need to install ssb-private as a plugin and use its publish method I think

    if (isRitual(content)) server.publish(content, callback)
    else callback(content.errors)
  }
}
