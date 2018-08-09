const isReply = require('scuttle-invite/isReply')
const getContent = require('ssb-msg-content')
const secrets = require('secrets.js-grempe')

module.exports = function (msg) {
  return isReply(msg) && validateShard(msg)
}

function validateShard (possibleReply) {
  const shard = getContent(possibleReply).body
  try {
    secrets.extractShareComponents(shard)
  } catch (err) {
    return false
  }
  return true
}
