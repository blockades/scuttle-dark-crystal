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

    if (isRitual(content)) {
      server.private.publish(content, [server.id], (err, ritual) => {
        callback(err, server.private.unbox(ritual))
      })
    } else callback(content.errors)
  }
}
