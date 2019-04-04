const pull = require('pull-stream')
// const next = require('pull-next-query')
const ShardsFromOthers = require('../../shard/pull/from-others')
const forwardRequestBySecretOwner = require('./by-secret-owner')

module.exports = function (server) {
  const shardsFromOthers = ShardsFromOthers(server)
  return function forOwnShards (opts = {}) {
    return pull(
      shardsFromOthers(),
      pull.unique(s => s.value.author),
      pull.map(shard => {
        pull(
          forwardRequestBySecretOwner(shard.value.author),
          pull.collect((err, forwards) => {
            if (err) return err
            return forwards
          })
        )
      })
    )
  }
}
