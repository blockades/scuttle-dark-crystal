
const { isShard, SCHEMA_VERSION } = require('ssb-dark-crystal-schema')

module.exports = function (server) {
  return function publish (params, callback) {
    var content = Object.assign({}, {
      type: 'dark-crystal/shard',
      version: SCHEMA_VERSION
    }, params)

    if (isShard(content)) server.publish(content, callback)
    else callback(content.errors)
  }
}
