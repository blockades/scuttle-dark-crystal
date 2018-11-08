const secrets = require('secrets.js-grempe')
const crypto = require('crypto')

module.exports = {
  share: function (secret, numOfShards, quorum) {
    const hexSecret = secrets.str2hex(secret)
    const hashOfSecret = crypto.createHash('sha1').update(secret, 'binary').digest('hex')
    const shardsHex = secrets.share(hexSecret + hashOfSecret, numOfShards, quorum)
  
    const shardsBase64 = shardsHex.map(shard => {
      const shardData = shard.slice(3)
      const shardDataBase64 = Buffer.from(shardData, 'hex').toString('base64')
      return shard.slice(0,3) + shardDataBase64
    })
    console.log('IN', shardsBase64)
    console.log(shardsHex[0].length, shardsBase64[0].length)
    return shardsBase64
  },

  combine: function (shardsBase64) {
    const shards = shardsBase64.map(shard => {
      const shardData = shard.slice(3)
      const shardDataHex = Buffer.from(shardData, 'base64').toString('hex')
      return shard.slice(0,3) + shardDataHex
    })
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
