const pull = require('pull-stream')
// const next = require('pull-next-query')
const ShardsFromOthers = require('../../shard/pull/from-others')
const forwardRequestBySecretOwner = require('./by-secret-owner')
const { get } = require('lodash')

module.exports = function (server) {
  const shardsFromOthers = ShardsFromOthers(server)

  return function forOwnShards (filter, opts = {}) {
    if ((typeof filter === 'object') && (opts === null)) {
      opts = filter
      filter = null
    }
    if (!filter) filter = () => true // don't filter anything

    return pull(
      shardsFromOthers(),
      pull.filter(filter),
      pull.unique(s => get(s, 'value.author')),
      pull.asyncMap((shard, cb) => {
        pull(
          forwardRequestBySecretOwner(get(shard, 'value.author')),
          pull.collect((err, forwards) => {
            if (err) cb(err)
            cb(null, forwards)
          })
        )
      })
    )
  }
}
