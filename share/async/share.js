const secrets = require('secrets.js-grempe')

const PublishRoot = require('../../root/async/publish')
const PublishRitual = require('../../ritual/async/publish')
const PublishAllShards = require('../../shard/async/publishAll')

const { isFeed } = require('ssb-ref')

module.exports = function (server) {
  const publishRoot = PublishRoot(server)
  const publishRitual = PublishRitual(server)
  const publishAllShards = PublishAllShards(server)

  return function ({ name, secret, quorum, recps }, callback) {
    if (!callback && typeof callback !== 'function') {
      throw new Error('provide a callback')
    }

    var validator = prePublishValidation()
    if (!validator.valid) return callback(valid.errors.join(', '))

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
        // SOLUTION: Have a publishShards (plural) function which validates each with isShard before publishing all
        // RESOLUTION: Extracted reducer into a publishAll function
        publishAllShards({ shards, recps, rootId }, (err, shards) => {
          if (err) callback(err)
          else callback(null, shards)
        })
      })
    })

    function prePublishValidation () {
      let recipients = sanitize(recps)

      var errors = []
      if (recipients.length < 1)
        errors.push(new Error(`data.recps: must be a feedId`))

      if (recipients.includes(server.id))
        errors.push(new Error(`data.recps: doesn't need to include self`))

      if (!isNumber(quorum))
        errors.push(new Error('data.quorum: must be a number'))

      if (quorum === 0)
        errors.push(new Error(`data.quorum: must be greater than 0`))

      if (recipients.length < quorum)
        errors.push(new Error(`data.quorum: greater than number of recps`))

      return {
        valid: errors.length === 0,
        errors: errors
      }
    }
  }
}

function isNumber (variable) {
  return Number(variable) !== NaN
}

function sanitizeRecps (recps) {
  if (!Array.isArray(recps)) return []

  // this removes the { name: 'thingy', link: '@...' },
  // instead just returns feedId '@...'
  let feedIds = recps
    .map(recp => typeof recp === 'string' ? recp : recp.link)
    .filter(Boolean)
    .filter(isFeed)

  return [...new Set(feedIds)]
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
