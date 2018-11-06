const secrets = require('secrets.js-grempe')
const crypto = require('crypto')

const PublishRoot = require('../../root/async/publish')
const PublishRitual = require('../../ritual/async/publish')
const PublishAllShards = require('../../shard/async/publish-all')

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
    if (!isNumber(quorum)) throw new Error('quorum must be a number')
    if (!Array.isArray(recps)) throw new Error('recps must be an array')
    if (!isFunction(callback)) throw new Error('callback is not a function')

    let feedIds = recps
      .map(recp => typeof recp === 'string' ? recp : recp.link)
      .filter(Boolean)
      .filter(isFeed)
    if (feedIds.length < recps.length) return callback(new Error(`data.recps: all recps must be a feedId`))

    let recipients = [...new Set(feedIds)]
    if (recipients.length < feedIds.length) return callback(new Error(`data.recps: please provide unique feedIds`))

    if (recipients.includes(server.id)) return callback(new Error(`data.recps: can't include ${server.id}`))
    if (quorum < 1) return callback(new Error(`data.quorum: must be greater than 0`))
    if (quorum > recipients.length) return callback(new Error(`data.quorum: greater than number of recps`))

    const numOfShards = recps.length

    const hexSecret = secrets.str2hex(secret)
    const hashOfSecret = crypto.createHash('sha1').update(secret, 'binary').digest('hex')
    const shards = secrets.share(hexSecret + hashOfSecret, numOfShards, quorum)

    publishRoot(name, (err, root) => {
      if (err) return callback(err)

      // Note shards field ACTUALLY as a number - more descriptive
      publishRitual({ root: root.key, shards: numOfShards, quorum }, (err, ritual) => {
        if (err) return callback(err)
        var rootId = root.key
        // QUESTION: Can we somehow wrap the shard publication in a single database 'transaction'?
        // TEMP SOLUTION: Have a publishAllShards (plural) function which validates each with isShard before publishing all
        // RESOLUTION: Extracted reducer into a publishAll function
        //
        publishAllShards({ shards, recps: recipients, rootId }, (err, shards) => {
          console.error(err)
          if (err) return callback(err)

          callback(null, {
            root: root,
            ritual: ritual,
            shards: shards
          })
        })
      })
    })
  }
}
