const getContent = require('ssb-msg-content')
const { combine, validateShard } = require('../../lib/secrets-wrapper')

// see recover/async/fetch.js for shape of data

module.exports = function mend (data, cb) {
  const { ritual, shardsData } = data
  const shardVersion = getShardVersion(ritual)

  const _shards = shardsData
    .reduce((acc, { feedId, shard, requestsData }) => {
      // mix: This needs to change for ephemeral returns
      //  - need to check replyVersion (what mode of reply is this?)
      //  - can't take any successfull request

      const successfulRequest = requestsData.find(request => request.reply)
      if (!successfulRequest) return acc

      acc.push(getShardFragment(successfulRequest.reply))
      return acc
    }, [])
    .filter(_shard => validateShard(_shard, shardVersion))

  if (!_shards.length) return cb(new Error('no valid shards provided to mend'))

  var secret
  try {
    secret = combine(_shards, shardVersion)
  } catch (err) {
    return cb(err)
  }

  if (!secret) return cb(new Error('unable to successfully mend shards'))

  cb(null, secret)
}

// mix: TODO - decide where the 'canonical' defn of the shard version should be ?
// root / ritual / shard / reply shardVersion ?
function getShardVersion (ritual) {
  return getContent(ritual).version
}

function getShardFragment (reply) {
  return getContent(reply).body
}
