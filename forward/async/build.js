const { isForward, errorParser } = require('ssb-dark-crystal-schema')

module.exports = function buildShard (server) {
  return function ({ root, shard, shardVersion, recp }, cb) {
    // this undoes the privatebox packing we've used to encrypt shards
    server.private.unbox(shard, (err, theDecryptedShard) => {
      if (err) return cb(err)

      var content = {
        type: 'dark-crystal/forward',
        version: '2.0.0',
        root,
        shard: theDecryptedShard,
        shardVersion,
        recps: [recp, server.id]
      }

      if (!isForward(content)) return cb(errorParser(content))

      cb(null, content)
    })
  }
}
