const { box } = require('ssb-keys')
const { isShard, errorParser } = require('ssb-dark-crystal-schema')
const { pickBy, identity } = require('lodash')
// TODO - change to use secretbox from sodium?

module.exports = function buildShard (server) {
  return function ({ root, shard, recp, attachment }, cb) {
    var content = {
      type: 'dark-crystal/shard',
      version: '2.0.0',
      root,
      shard: box(shard, [recp]),
      recps: [recp, server.id],
      attachment
    }

    // remove falsey values
    content = pickBy(content, identity)

    if (!isShard(content)) return cb(errorParser(content))

    cb(null, content)
  }
}
