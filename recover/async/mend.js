const getContent = require('ssb-msg-content')
const get = require('lodash.get')
const { combine, unpack, validateShard } = require('../../lib/secrets-wrapper')
const pull = require('pull-stream')

// see recover/async/fetch.js for shape of data

module.exports = function mend (server) {
  return function (data, cb) {
    if (data.shardsData.length === 0) return cb(new Error('cannot find any shards'))

    const shareVersion = getShareVersion(data)
    if (!shareVersion) return cb(null, new Error('unknown share version, unable to mend shards'))

    // const shards = getShards(data, shareVersion)
    getShards(data, shareVersion, (err, shards) => {
      if (err) return cb(err)
      if (!shards.length) return cb(new Error('no valid shards provided to mend'))

      var secret
      try {
        secret = combine(shards, shareVersion)
      } catch (err) {
        return cb(err)
      }
      if (!secret) return cb(new Error('unable to successfully mend shards'))

      const unpackedSecret = unpack(secret, shareVersion)
      if (!unpackedSecret) return cb(new Error('Badly formed secret'))

      cb(null, unpackedSecret)
    })
  }

  // helpers

  function getShareVersion ({ ritual, shardsData }) {
    // if we have the ritual, that's the best record of the shareVersion (I think?!)
    if (ritual) return getContent(ritual).version
    // otherwise we've been forwarded shards, and can check version on them
    const versions = shardsData
      .map(data => get(data, 'forwardsData[0].forward.value.content.shareVersion'))
      .filter(Boolean)

    return mode(versions)
  }
  function mode (array) {
    return array.sort((a, b) => (
      array.filter(v => v === a).length -
        array.filter(v => v === b).length
    )).pop()
  }

  function getShards ({ root, shardsData }, shareVersion, callback) {
    if (root) {
      getRequestedShards(shardsData, shareVersion, root.key, callback)
    } else {
      callback(null, getForwardedShards(shardsData, shareVersion))
    }
  }

  function getRequestedShards (shardsData, shareVersion, rootId, callback) {
    pull(
      pull.values(shardsData.reduce((acc, { feedId, shard, requestsData }) => {
        const reply = get(requestsData.find(request => request.reply), 'reply')
        if (!reply) return acc

        acc.push({ feedId, share: getShare(reply) })
        return acc
      }, [])),
      pull.asyncMap((shard, cb) => {
        if (shareVersion === '1.0.0' || !isBoxedMessage(shard.share)) {
          cb(null, shard.share)
        } else {
          const dbKey = JSON.stringify({ rootId, recp: shard.feedId })

          const contextMessage = dbKey
          server.ephemeral.unBoxMessage(dbKey, shard.share, contextMessage, (err, rawShard) => {
            err ? cb(err) : cb(null, rawShard)
          })
        }
      }),
      pull.filter(shard => validateShard(shard, shareVersion)),
      pull.collect((err, shards) => {
        if (err) callback(err)
        // return shards
        callback(null, shards)
      })
    )
  }

  function getForwardedShards (shardsData, shareVersion) {
    return shardsData
      .reduce((acc, { feedId, shard, forwardsData }) => {
        const forward = get(forwardsData, '[0].forward') // just get the first fwd
        if (!forward) return acc
        if (getContent(forward).shareVersion !== shareVersion) return acc

        acc.push(getShare(forward))
        return acc
      }, [])
      .filter(shard => validateShard(shard, shareVersion))
  }

  function getShare (msg) {
    const { type, body, shard } = getContent(msg)

    switch (type) {
      case 'invite-reply': return body
      case 'dark-crystal/forward': return shard
    }
  }
}
// TODO: should we use isCanonicalBase64 ?
function isBoxedMessage (message) {
  return /\.box$/.test(message)
}
