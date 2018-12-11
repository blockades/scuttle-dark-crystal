const getContent = require('ssb-msg-content')
const get = require('lodash.get')
const { combine, validateShard } = require('../../lib/secrets-wrapper')

// see recover/async/fetch.js for shape of data

module.exports = function mend (data, cb) {
  if (data.shardsData.length === 0) return cb(new Error('cannot find any shards'))

  const shardVersion = getShardVersion(data)
  if (!shardVersion) return cb(null, new Error('unknown shard version, unable to mend shards'))

  const shards = getShards(data, shardVersion)
  if (!shards.length) return cb(new Error('no valid shards provided to mend'))

  var secret
  try {
    secret = combine(shards, shardVersion)
  } catch (err) {
    return cb(err)
  }
  if (!secret) return cb(new Error('unable to successfully mend shards'))

  cb(null, secret)
}

// helpers

function getShardVersion ({ ritual, shardsData }) {
  // if we have the ritual, that's the best record of the shardVersion (I think?!)
  if (ritual) return getContent(ritual).version

  // otherwise we've been forwarded shards, and can check version on them
  const versions = shardsData
    .map(data => get(data, 'forwardsData[0].forward.value.content.shardVersion'))
    .filter(Boolean)

  return mode(versions)
}
function mode (array) {
  return array.sort((a, b) => (
    array.filter(v => v === a).length -
      array.filter(v => v === b).length
  )).pop()
}

function getShards ({ root, shardsData }, shardVersion) {
  return root
    ? getRequestedShards(shardsData, shardVersion)
    : getForwardedShards(shardsData, shardVersion)
}

function getRequestedShards (shardsData, shardVersion) {
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
    .filter(shard => validateShard(shard, shardVersion))
}

function getForwardedShards (shardsData, shardVersion) {
  return shardsData
    .reduce((acc, { feedId, shard, forwardsData }) => {
      const forward = get(forwardsData, '[0].forward') // just get the first fwd
      if (!forward) return acc
      if (getContent(forward).shardVersion !== shardVersion) return acc

      acc.push(getShare(forward))
      return acc
    }, [])
    .filter(shard => validateShard(shard, shardVersion))
}

function getShare (msg) {
  const { type, body, shard } = getContent(msg)

  switch (type) {
    case 'invite-reply': return body
    case 'dark-crystal/forward': return shard
  }
}
