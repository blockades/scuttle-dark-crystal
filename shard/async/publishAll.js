const pull = require('pull-stream')

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
          shard: server.private.box(shard, [recp]),
          recps: [recp, server.id]
        }
      }),
      pull.filter(isShard),
      pull.collect((err, params) => {
        if (params.length !== shards.length) {
          let errors = msgs
            .map(msg => msg.errors)
            .filter(errorParser)

          return callback(new Error(`${errors}`))
        }
        pull(
          pull.values(params),
          pull.asyncMap(server.publish),
          pull.collect((err, msgs) => {
            if (err) callback(err)
            else callback(null, msgs)
          })
        )
      })
    )
  }
}

