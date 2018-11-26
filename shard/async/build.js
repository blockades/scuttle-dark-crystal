const { box } = require('ssb-keys')
const { isShard, errorParser } = require('ssb-dark-crystal-schema')
// TODO - change to use secretbox from sodium?

module.exports = function buildShard (server) {
  return function ({ root, shard, recp }, cb) {
    const content = {
      type: 'dark-crystal/shard',
      version: '2.0.0',
      root,
      shard: box(shard, [recp]),
      recps: [recp, server.id]
    }

    if (!isShard(content)) return cb(errorParser(content))

    cb(null, content)
  }
}
