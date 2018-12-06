const getContent = require('ssb-msg-content')
const { combine, validateShard } = require('../../lib/secrets-wrapper')

// see recover/async/fetch.js for shape of data object

module.exports = function mend (data, cb) {
  const { ritual, shardsData } = data

  const version = getShardVersion(ritual)

  const _shards = shardsData
    .reduce((acc, { feedId, shard, requests }) => {
      const successfulRequest = requests.find(request => request.reply)
      // mix: Note this just gets any reply. This needs to change for ephemeral returns
      if (!successfulRequest) return acc

      acc.push(getShardFragment(successfulRequest.reply))
      return acc
    }, [])
    .filter(_shard => validateShard(_shard, version))

  if (!_shards.length) return cb(new Error('no valid shards provided to mend'))

  const secret = combine(_shards, version)
  if (secret) cb(null, secret)
  else cb(new Error('unable to successfully mend shards'))
}

// mix: TODO is root or ritual or shard the best place to know the sharding version?
function getShardVersion (ritual) {
  return getContent(ritual).version
}

function getShardFragment (reply) {
  return getContent(reply).body
}
