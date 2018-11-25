const isReply = require('scuttle-invite/isReply')
const getContent = require('ssb-msg-content')
const { validateShard } = require('./secretsWrapper')

module.exports = function (msg, version) {
  const msgContent = getContent(msg)
  const shard = msgContent.body
  return isReply(msg) && validateShard(shard, version)
}
