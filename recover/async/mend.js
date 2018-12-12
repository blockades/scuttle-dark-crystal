const getContent = require('ssb-msg-content')
const get = require('lodash.get')
const { combine, validateShard } = require('../../lib/secrets-wrapper')
const isString = require('../../lib/isString')

// see recover/async/fetch.js for shape of data

module.exports = function mend (data, cb) {
  if (data.shardsData.length === 0) return cb(new Error('cannot find any shards'))

  const shareVersion = getShareVersion(data)
  if (!shareVersion) return cb(null, new Error('unknown share version, unable to mend shards'))

  const shards = getShards(data, shareVersion)
  if (!shards.length) return cb(new Error('no valid shards provided to mend'))

  var secret
  try {
    secret = combine(shards, shareVersion)
  } catch (err) {
    return cb(err)
  }
  if (!secret) return cb(new Error('unable to successfully mend shards'))

  const secretObj = secretObject(secret, shardVersion)

  secretObj ? cb(null, secretObj) : cb(new Error('Badly formed secret'))
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

function getShards ({ root, shardsData }, shareVersion) {
  return root
    ? getRequestedShards(shardsData, shareVersion)
    : getForwardedShards(shardsData, shareVersion)
}

function getRequestedShards (shardsData, shareVersion) {
  return shardsData
    .reduce((acc, { feedId, shard, requestsData }) => {
      // mix: This needs to change for ephemeral returns
      //  - need to check replyVersion (what mode of reply is this?)
      //  - can't take any successfull request

      const reply = get(requestsData.find(request => request.reply), 'reply')
      if (!reply) return acc

      acc.push(getShare(reply))
      return acc
    }, [])
    .filter(shard => validateShard(shard, shareVersion))
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

function secretObject (secret, version) {
  switch (version) {
    case '2.0.0': {
      let secretArr
      try {
        secretArr = JSON.parse(secret)

        if ((secretArr.length !== 2) || (!secretArr.every(isString))) return false
      } catch (err) {
        return false
      }
      return { secret: secretArr[0], label: secretArr[1] }
    }
    case '1.0.0': {
      return { secret }
    }
  }
}
