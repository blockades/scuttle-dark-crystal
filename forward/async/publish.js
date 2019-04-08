const pull = require('pull-stream')
const ref = require('ssb-ref')
const get = require('lodash.get')
const PullShardsByRoot = require('../../shard/pull/by-root')
const buildForward = require('./build')
const publish = require('../../lib/publish-msg')
const PullForwardRequestsSecretOwner = require('../../forward-request/pull/by-secret-owner')

module.exports = function (server) {
  const pullShardsByRoot = PullShardsByRoot(server)
  const pullForwardRequestsSecretOwner = PullForwardRequestsSecretOwner(server)
  return function publishForward (root, recp, callback) {
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

        if (get(shards[0], 'value.author') === recp) {
          return callback(new Error('You may not forward a shard to its author. Use reply instead.'))
        }
        pull(
          pullForwardRequestsSecretOwner(get(shards[0], 'value.author')),
          pull.collect((err, forwardRequests) => {
            var requestId = null
            if (err) return callback(err)
            if (forwardRequests.length > 0) {
              requestId = forwardRequests[0]
            }

            const shareVersion = get(shards[0], 'value.content.version')
            const shardId = get(shards[0], 'key')
            const shard = get(shards[0], 'value.content.shard')

            buildForward(server)({ root, shard, shardId, requestId, shareVersion, recp }, (err, content) => {
              if (err) return callback(err)

              publish(server)(content, callback)
            })
          })
        )
      })
    )
  }
}
