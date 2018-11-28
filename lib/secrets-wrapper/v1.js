const secrets = require('secrets.js-grempe')

module.exports = {
  share: function shareV1 (secret, numOfShards, quorum) {
    const hexSecret = secrets.str2hex(secret)
    return secrets.share(hexSecret, numOfShards, quorum)
  },
  combine: function combineV1 (shards) {
    const hex = secrets.combine(shards)
    return secrets.hex2str(hex)
  },
  validateShard: function validateShardV1 (shard) {
    try {
      secrets.extractShareComponents(shard)
    } catch (err) {
      return false
    }
    return true
  }
}
