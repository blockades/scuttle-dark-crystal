const _isReply = require('scuttle-invite/isReply')
const getContent = require('ssb-msg-content')
const { validateShard } = require('./lib/secrets-wrapper')

module.exports = function isReply (msg) {
  const msgContent = getContent(msg)
  const shard = msgContent.body
  let shardVersion = msgContent.shardVersion || '1.0.0'
  const errors = []
  if (!_isReply(msg)) errors.push(_isReply.errors)
  if (!validateShard(shard, shardVersion)) errors.push(new Error('invalid shard'))

  if (!errors.length) return true

  isReply.errors = errors
  return false
}
