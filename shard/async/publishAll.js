const pull = require('pull-stream')
const ssbKeys = require('ssb-keys')

const { isShard, SCHEMA_VERSION, errorParser } = require('ssb-dark-crystal-schema')

module.exports = function (server) {
  return function publishAll ({ shards, recps, rootId }, callback) {
    const indexes = [...Array(shards.length).keys()]

    const shardMsgs = indexes
      .map(index => {
        let recp = recps[index]
        let shard = shards[index]
        return {
          type: 'dark-crystal/shard',
          version: SCHEMA_VERSION,
          root: rootId,
          shard: ssbKeys.box(shard, [recp]),
          recps: [recp, server.id]
        }
      })
      .map(shard => {
        isShard(shard) // isShard adds errors to shard if there are any
        return shard
      })

    const errors = shardMsgs
      .filter(s => s.errors)
      .map(errorParser)

    if (errors.length) return callback(new Error(errors.join(' ')))

    pull(
      pull.values(shardMsgs),
      pull.asyncMap((shardMsg, cb) => { 
        server.private.publish(shardMsg, shardMsg.recps, (err, msg) => {
          if (err) cb(err)
          else cb(null, server.private.unbox(msg))
        }) 
      }),
      pull.collect(callback)
    )
  }
}

