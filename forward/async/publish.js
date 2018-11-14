const { isForward, SCHEMA_VERSION } = require('ssb-dark-crystal-schema')
const pull = require('pull-stream')
const PullShardsByRoot = require('../../shard/pull/by-root')
const ref = require('ssb-ref')

module.exports = function (server) {
  const pullShardsByRoot = PullShardsByRoot(server)
  return function publish (root, recp, callback) {
    if (!ref.isMsgId(root)) return callback(new Error('Invalid rootId'))
    pull(
      pullShardsByRoot(root),
      pull.collect((err, shards) => {
        if (err) return callback(err)

        if (shards.length < 1) {
          let error = new Error('There are no shards associated with rootId ', root)
          return callback(error)
        }

        if (shards.length > 1) {
          let error = new Error('You have more than one shard for this secret, not yet supported')
          return callback(error)
        }

        const {
          value: {
            content: { shard }
          }
        } = shards[0]

        server.private.unbox(shard, (err, theDecryptedShard) => {
          if (err) return callback(err)

          var content = {
            type: 'dark-crystal/forward',
            version: SCHEMA_VERSION,
            root,
            shard: theDecryptedShard,
            recps: [recp, server.id]
          }

          if (isForward(content)) {
            server.private.publish(content, [server.id], (err, forward) => {
              if (err) callback(err)
              else server.private.unbox(forward, callback)
            })
          } else callback(isForward.errors)
        })
      })
    )
  }
}
