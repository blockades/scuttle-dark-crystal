const _isReply = require('scuttle-invite/isReply')
const getContent = require('ssb-msg-content')
const { validateShard } = require('./lib/secrets-wrapper')

module.exports = function isReply (msg, version) {
  const msgContent = getContent(msg)
  const shard = msgContent.body

  const errors = []
  if (!_isReply(msg)) errors.push(new Error('invalid reply'))
  if (!validateShard(shard, version)) errors.push(new Error('invalid shard'))
  // TODO this should be derived from shardVersion... that travels with the reply?

  if (!errors.length) return true

  isReply.errors = errors
  return false
}
