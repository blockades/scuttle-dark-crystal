const secrets = require('secrets.js-grempe')

const PublishRoot = require('../../root/async/publish')
const PublishRitual = require('../../ritual/async/publish')
const PublishAllShards = require('../../shard/async/publishAll')

const { isFeed } = require('ssb-ref')

const isNumber = require('../../lib/isNumber')
const isString = require('../../lib/isString')
const isFunction = require('../../lib/isFunction')

module.exports = function (server) {
  const publishRoot = PublishRoot(server)
  const publishRitual = PublishRitual(server)
  const publishAllShards = PublishAllShards(server)

  return function ({ name, secret, quorum, recps }, callback) {
    if (!name && !isString(name)) throw new Error('name must be a string')
    if (!secret && !isString(secret)) throw new Error('secret must be a string')
    if (!quorum && !isNumber(quorum)) throw new Error('quorum must be a number')
    if (!recps && !Array.isArray(recps)) throw new Error('recps must be an array')
    if (!callback && !isFunction(callback)) throw new Error('callback is not a function')

    let feedIds = recps
      .map(recp => typeof recp === 'string' ? recp : recp.link)
      .filter(Boolean)
      .filter(isFeed)

    if (feedIds.length < recps.length) return callback(new Error(`data.recps: must be a feedId`))

    let recipients = [...new Set(feedIds)]

    if (recipients.length < feedIds.length) return callback(new Error(`data.recps: please provide unique feedIds`))
    if (recipients.includes(server.id)) return callback(new Error(`data.recps: can't include ${server.id}`))
    if (quorum === 0) return callback(new Error(`data.quorum: must be greater than 0`))
    if (recipients.length < quorum) return callback(new Error(`data.quorum: greater than number of recps`))

    const numOfShards = recps.length

    // IDEA: Could be cool to allow for object storage?
    // Permit upload of JSON, YML, etc, files...
    const hexSecret = secrets.str2hex(secret)
    const shards = secrets.share(hexSecret, numOfShards, quorum)

    publishRoot({ name }, (err, root) => {
      if (err) return callback(err)

      // Should specify this shards field ACTUALLY as a number - more descriptive
      publishRitual({ root: root.key, shards: numOfShards, quorum }, (err, ritual) => {
        if (err) return callback(err)

        // QUESTION: Can we somehow wrap the shard publication in a single database 'transaction'?
        // TEMP SOLUTION: Have a publishAllShards (plural) function which validates each with isShard before publishing all
        // RESOLUTION: Extracted reducer into a publishAll function
        publishAllShards({ shards, recps, rootId }, (err, shards) => {
          if (err) callback(err)
          else callback(null, {
            root: root,
            ritual: ritual,
            shards: shards
          })
        })
      })
    })
  }
}

// getRoot(rootId, (err, root) => {
//   if (!root) return publishRoot({ name }, performSecretRitual)
//   else {
//     pull(
//       myRituals()
//       pull.collect((err, msgs) => {
//         if (err) return callback(err)
//         if (msgs.length > 1) return callback(new Error('data.root: already has ritual'))
//         performSecretRitual(err, root)
//       })
//     )
//   }
// })

// function performSecretRitual (err, root) {
//   if (err) return callback(err)

//   publishRitual({ root: root.key, shards: numOfShards, quorum }, (err, ritual) => {
//     if (err) return callback(err)

//     var params = Array.from(Array(numOfShards).keys()).reduce((acc, index) => {
//       acc.push({
//         root: root.key,
//         shard: box(shard, [recp[index]]),
//         recipient: recps[index]
//       })
//       return acc
//     }, [])

//     pull(
//       pull.values(params),
//       pull.asyncMap(publishShard),
//       pull.collect((err, shards) => {
//         if (err) return callback(err)
//         callback(null, msgs)
//       })
//     )
//   })
// }
