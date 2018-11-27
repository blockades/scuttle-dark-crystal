const { isRitual } = require('ssb-dark-crystal-schema')
const TOOL = 'secrets.js-grempe'
const toolVersion = require('../../package.json').dependencies[TOOL]
const publish = require('../../lib/publish-msg')

if (!toolVersion) throw new Error('LOOK OUT, you need to update which tool is being backed into ritual messages!')

module.exports = function (server) {
  return function publishRitual ({ root, shards, quorum }, callback) {
    var content = {
      type: 'dark-crystal/ritual',
      version: '2.0.0',
      root,
      shards,
      quorum,
      tool: `${TOOL}@${toolVersion}`,
      recps: [server.id]
    }

    if (!isRitual(content)) return callback(isRitual.errors)

    publish(server)(content, callback)
  }
}
