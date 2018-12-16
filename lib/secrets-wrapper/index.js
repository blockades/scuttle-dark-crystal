const v2 = require('./v2')
const v1 = require('./v1')

module.exports = {
  pack: v2.pack,
  unpack: function unpack (secret, version) {
    switch (version) {
      case '2.0.0': return v2.unpack(secret)
      case '1.0.0': return v1.unpack(secret)
    }
  },
  share: v2.share,
  combine: function combine (shards, version) {
    switch (version) {
      case '2.0.0': return v2.combine(shards)
      case '1.0.0': return v1.combine(shards)
    }
  },
  validateShard: function validateShard (shard, version) {
    switch (version) {
      case '2.0.0': return v2.validateShard(shard)
      case '1.0.0': return v1.validateShard(shard)
    }
  }
}
