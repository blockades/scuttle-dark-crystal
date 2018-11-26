const pull = require('pull-stream')
const { isMsg, isFeed } = require('ssb-ref')

const buildShard = require('../async/build')

module.exports = function (server) {
  return function publishAll ({ shards, recps, rootId }, callback) {
    if (!validRecps(recps)) return callback(new Error('shards publishAll: all recps must be valid feedIds', recps))
    if (!isMsg(rootId)) return callback(new Error('shard publishAll: invalid rootId', rootId))
    if (shards.length !== recps.length) return callback(new Error('shard publishAll: need as many shards as recps'))

    const opts = shards.map((shard, i) => {
      return { root: rootId, shard, recp: recps[i] }
    })

    pull(
      pull.values(opts),
      pull.asyncMap(buildShard(server)),
      pull.collect((err, shardMsgs) => {
        if (err) return callback(err)

        publishAll(shardMsgs)
      })
    )

    function publishAll (shards) {
      pull(
        pull.values(shards),
        pull.asyncMap((shardMsg, cb) => {
          server.private.publish(shardMsg, shardMsg.recps, (err, msg) => {
            if (err) cb(err)
            else server.private.unbox(msg, cb)
          })
        }),
        // pull.through(console.log),
        pull.collect(callback)
      )
    }
  }
}

function validRecps (recps) {
  return recps.every(isFeed)
}
