const isReply = require('scuttle-invite/isReply')
const getContent = require('ssb-msg-content')
const { validateShard } = require('./secretsWrapper')

module.exports = function (msg) {
  const msgContent = getContent(msg).body
  return isReply(msg) && validateShard(msgContent)
}
