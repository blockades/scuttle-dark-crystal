const pull = require('pull-stream')
// const next = require('pull-next-query')
const ShardsFromOthers = require('../../shard/pull/from-others')
const forwardRequestBySecretOwner = require('./by-secret-owner')
const { get } = require('lodash')

module.exports = function (server) {
  const shardsFromOthers = ShardsFromOthers(server)
  return function forOwnShards (opts = {}) {
    return pull(
      shardsFromOthers(),
      // This query is specific to recovering SSB identities
      pull.filter(shard => get(shard, 'value.content.attachment.name') === 'gossip.json'),
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
