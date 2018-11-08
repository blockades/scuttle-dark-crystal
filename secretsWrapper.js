const secrets = require('secrets.js-grempe')
const crypto = require('crypto')

module.exports = {
  share: function (secret, numOfShards, quorum) {
    const hexSecret = secrets.str2hex(secret)
    const hashOfSecret = crypto.createHash('sha1').update(secret, 'binary').digest('hex')
    const shardsHex = secrets.share(hexSecret + hashOfSecret, numOfShards, quorum)
    return shardsHex.map(shard => Buffer.from(shard, 'utf8').toString('base64'))
  },

  combine: function (shardsBase64) {
    const shards = shardsBase64.map(shard => Buffer.from(shard, 'base64').toString('utf8'))
    // this could probably be improved by checking the hash before converting to hex
    const hex = secrets.combine(shards)
    const hashOfSecret = hex.slice(-40)
    var secret = secrets.hex2str(hex.slice(0, -40))
    if (crypto.createHash('sha1').update(secret, 'binary').digest('hex') !== hashOfSecret) {
      throw new Error('This does not look like a secret')
    } else {
      return secret
    }
  },
  validateShard: function (shardBase64) {
    const shard = Buffer.from(shardBase64, 'base64').toString('utf8')
    try {
      secrets.extractShareComponents(shard)
    } catch (err) {
      return false
    }
    return true
  }
}
