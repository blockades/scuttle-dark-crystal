const secrets = require('secrets.js-grempe')
const sodium = require('chloride')
const MAC_LENGTH = 32

const packShard = shard => {
  const shardData = shard.slice(3)
  const shardDataBase64 = Buffer.from(shardData, 'hex').toString('base64')
  return shard.slice(0, 3) + shardDataBase64
}

const unpackShard = shard => {
  const shardData = shard.slice(3)
  const shardDataHex = Buffer.from(shardData, 'base64').toString('hex')
  return shard.slice(0, 3) + shardDataHex
}

module.exports = {
  share: function (secret, numOfShards, quorum) {
    const hexSecret = secrets.str2hex(secret)
    const mac = sodium.crypto_hash_sha256(Buffer.from(secret)).toString('hex').slice(-1 * MAC_LENGTH)
    const shardsHex = secrets.share(hexSecret + mac, numOfShards, quorum)

    const shardsBase64 = shardsHex.map(packShard)
    return shardsBase64
  },

  combine: function (shards, version) {
    if (version === '2.0.0') {
      const unpackedShards = shards.map(unpackShard)
      // this could probably be improved by checking the hash before converting to hex
      const hex = secrets.combine(unpackedShards)
      const mac = hex.slice(-1 * MAC_LENGTH)
      var secret = secrets.hex2str(hex.slice(0, -1 * MAC_LENGTH))
      if (sodium.crypto_hash_sha256(Buffer.from(secret)).toString('hex').slice(-1 * MAC_LENGTH) !== mac) {
        throw new Error('This does not look like a secret')
      } else {
        return secret
      }
    } else if (version === '1.0.0') {
      const hex = secrets.combine(shards)
      return secrets.hex2str(hex)
    }
  },
  validateShard: function (shard, version) {
    if (version === '2.0.0') {
      const unpackedShard = unpackShard(shard)
      try {
        secrets.extractShareComponents(unpackedShard)
      } catch (err) {
        return false
      }
      return true
    } else if (version === '1.0.0') {
      try {
        secrets.extractShareComponents(shard)
      } catch (err) {
        return false
      }
      return true
    }
  }
}
