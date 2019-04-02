const { isFeed, isBlobId, isLink } = require('ssb-ref')

const PublishRoot = require('../../root/async/publish')
const PublishRitual = require('../../ritual/async/publish')
const PublishAllShards = require('../../shard/async/publish-all')

const secrets = require('dark-crystal-secrets')
const unpackLink = require('../../lib/unpackLink')
const isNumber = require('../../lib/isNumber')
const isString = require('../../lib/isString')
const isFunction = require('../../lib/isFunction')
const assert = require('../../lib/assert')


module.exports = function (server) {
  const publishRoot = PublishRoot(server)
  const publishRitual = PublishRitual(server)
  const publishAllShards = PublishAllShards(server)

  return function (params, callback) {
    var {
      name,
      secret,
      quorum,
      label,
      recps,
      attachment
    } = params
    assert((name && isString(name)), 'name must be a string')
    assert((secret && isString(secret)), 'secret must be a string')
    assert((isNumber(quorum)), 'quorum must be a number')
    assert((Array.isArray(recps)), 'recps must be an array')
    assert((isFunction(callback)), 'callback must be a function')

    if (attachment) {
      if (!isString(attachment.name)) return callback(new Error('data.attachment.name: provide an attachment name'))
      if (!isLink(attachment.link)) return callback(new Error('data.attachment.link: referenced schema does not match'))
      var { blobId, blobKey } = unpackLink(attachment.link)
      label = blobKey
      attachment = blobId
    }

    if (!label) label = name
    assert((isString(label)), 'label must be a string')

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

    const shards = secrets.share(secrets.pack(secret, label), numOfShards, quorum)

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
        publishAllShards({ shards, recps: recipients, rootId, attachment }, (err, shards) => {
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
