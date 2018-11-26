const secrets = require('secrets.js-grempe')

module.exports = {
  // share: ...,
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
