const secrets = require('secrets.js-grempe')
const crypto = require('crypto')

module.exports = {
  share: function (secret, numOfShards, quorum) {
    const hexSecret = secrets.str2hex(secret)
    const hashOfSecret = crypto.createHash('sha1').update(secret, 'binary').digest('hex')
    return secrets.share(hexSecret + hashOfSecret, numOfShards, quorum)
  },

  combine: function (shards) {
    // this could probably be improved by checking the hash before converting to hex
    const hex = secrets.combine(shards)
    const hashOfSecret = hex.slice(-40)
    var secret = secrets.hex2str(hex.slice(0, -40))
    if (crypto.createHash('sha1').update(secret, 'binary').digest('hex') !== hashOfSecret) {
      throw new Error('This does not look like a secret')
    } else {
      return secret
    }
  }
}
