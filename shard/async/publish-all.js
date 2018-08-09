const pull = require('pull-stream')
const { box } = require('ssb-keys')
const { isFeed } = require('ssb-ref')

const { isShard, SCHEMA_VERSION, errorParser } = require('ssb-dark-crystal-schema')

module.exports = function (server) {
  return function publishAll ({ shards, recps, rootId }, callback) {
    const indexes = [...Array(shards.length).keys()]

    if (!validRecps(recps)) return callback(new Error('All recps must be valid feedIds', recps))

    const shardMsgs = indexes
      .map(index => {
        let recp = recps[index]
        let shard = shards[index]
        return {
          type: 'dark-crystal/shard',
          version: SCHEMA_VERSION,
          root: rootId,
          shard: box(shard, [recp]),
          recps: [recp, server.id]
        }
      })
      .map(shard => {
        isShard(shard, {attachErrors: true})
        return shard
      })

    const errors = getErrors(shardMsgs)
    if (errors) return callback(new Error(errors))

    pull(
      pull.values(shardMsgs),
      pull.asyncMap((shardMsg, cb) => {
        server.private.publish(shardMsg, shardMsg.recps, (err, msg) => {
          if (err) cb(err)
          else server.private.unbox(msg, cb)
        })
      }),
      pull.collect(callback)
    )
  }
}

function validRecps (recps) {
  return recps.every(isFeed)
}

function getErrors (msgs) {
  const errors = msgs
    .filter(s => s.errors)
    .map(errorParser)

  return errors.length ? errors : null
}
