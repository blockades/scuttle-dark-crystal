const pull = require('pull-stream')
const ref = require('ssb-ref')
const get = require('lodash.get')
const PullShardsByRoot = require('../../shard/pull/by-root')
const buildForward = require('./build')
const publish = require('../../lib/publish-msg')

module.exports = function (server) {
  const pullShardsByRoot = PullShardsByRoot(server)
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

        const shard = get(shards[0], 'value.content.shard')

        buildForward(server)({ root, shard, recp }, (err, content) => {
          if (err) return callback(err)

          publish(server)(content, callback)
        })
      })
    )
  }
}
