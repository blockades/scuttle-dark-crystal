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
          return callback(new Error('There are no shards associated with rootId ', root))
        }

        if (shards.length > 1) {
          return callback(new Error('You have more than one shard for this secret, not yet supported'))
        }

        const {
          value: {
            author,
            content: { shard }
          }
        } = shards[0]

        if (author === recp) {
          return callback(new Error('You may not forward a shard to its author. Use reply instead.'))
        }

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
            server.private.publish(content, content.recps, (err, forward) => {
              if (err) callback(err)
              else server.private.unbox(forward, callback)
            })
          } else callback(isForward.errors)
        })
      })
    )
  }
}
