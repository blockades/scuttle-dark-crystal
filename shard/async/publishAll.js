const pull = require('pull-stream')
const ssbKeys = require('ssb-keys')

const { isShard, SCHEMA_VERSION, errorParser } = require('ssb-dark-crystal-schema')

module.exports = function (server) {
  return function publishAll ({ shards, recps, rootId }, callback) {
    let indexes = [...Array(shards.length).keys()]
    pull(
      pull.values(indexes),
      pull.map(index => {
        let recp = recps[index]
        let shard = shards[index]
        return {
          type: 'dark-crystal/shard',
          version: SCHEMA_VERSION,
          root: rootId,
          shard: ssbKeys.box(shard, [recp]),
          recps: [recp, server.id]
        }
      }),
      pull.map((shardCheck) => {
        if (isShard(shardCheck)) return shardCheck
        else return shardCheck 
      }),
      pull.collect((err,params) => {
        let errors = params
            .filter((msg) => { if (msg.errors) return msg.errors })
            .filter(errorParser)
        if (errors.length) return callback(new Error(`${errors}`))
        pull(
          pull.values(params),
          pull.asyncMap((shardMsg,callback) => { 
            server.private.publish(shardMsg, shardMsg.recps, (err,msg) => {
              callback(err,server.private.unbox(msg))
            }) 
          }),
          pull.collect((err, msgs) => {
            if (err) callback(err)
            else callback(null, msgs)
          })
        )
      })
    )
  }
}

