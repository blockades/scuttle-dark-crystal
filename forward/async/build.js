const isForward = require('../../isForward')

module.exports = function buildShard (server) {
  return function ({ root, shard, shardId, shareVersion, recp }, cb) {
    // this undoes the privatebox packing we've used to encrypt shards
    server.private.unbox(shard, (err, theDecryptedShard) => {
      if (err) return cb(err)

      var content = {
        type: 'dark-crystal/forward',
        version: '1.0.0',
        root,
        shard: theDecryptedShard,
        shardId,
        shareVersion,
        recps: [recp, server.id]
      }

      if (!isForward(content)) return cb(isForward.errors)

      cb(null, content)
    })
  }
}
