const { isReply: _isReply } = require('ssb-dark-crystal-schema')
const getContent = require('ssb-msg-content')
const { validateShard } = require('./lib/secrets-wrapper')

module.exports = function isReply (msg) {
  const {
    body: shard,
    shareVersion = '1.0.0' // early version 1 replies didn't have a shareVersion
  } = getContent(msg)

  const errors = []

  if (!_isReply(msg)) errors.push(new Error('invalid reply'))
  if (!validateShard(shard, shareVersion)) errors.push(new Error('invalid shard'))

  if (!errors.length) return true

  isReply.errors = errors
  return false
}
