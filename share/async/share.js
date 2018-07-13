const secrets = require('secrets.js-grempe')

const GetRoot = require('./get/root')
const PublishRoot = require('./publish/root')
const PublishRitual = require('./publish/ritual')
const PublishShard = require('./publish/shard')

module.exports = function (server) {
  const getRoot = GetRoot(server)
  const publishRitual = PublishRitual(server)

  return function ({ name, rootID, secret, quorum, recps }, callback) {
    const numOfShards = recps.length
    const shards = secrets.share(secret, numOfShards, quorum)

    getRoot(rootID, (err, root) => {
      if (!root) return publishRoot({ name }, performSecretRitual)
      else return performSecretRitual(err, root)
    })

    function performSecretRitual (err, root) => {
      if (err) return callback(err)

      publishRitual({ root, shards: numOfShards, quorum }, (err, ritual) => {
        var params = Array.from(Array(numOfShards).keys()).reduce((acc, index) => {
          acc.push({
            root: root.key,
            shard: shards[index],
            recps: [ recps[index], server.id ]
          })
          return acc
        }, [])

        pull(
          pull.values(params),
          pull.asyncMap(publishShard),
          pull.collect((err, shards) => {
            if (err) return callback(err)
            callback(null, msgs)
          })
        )
      })
    }
  }
}
