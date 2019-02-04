const { isReply: _isReply } = require('ssb-dark-crystal-schema')
const getContent = require('ssb-msg-content')
const { validateShard } = require('./lib/secrets-wrapper')
const isString = require('./lib/isString')

module.exports = function isReply (msg) {
  const {
    body: shard,
    shareVersion = '1.0.0' // early version 1 replies didn't have a shareVersion
  } = getContent(msg)

  const errors = []

  // TODO this is a mess
  if (!_isReply(msg)) errors.push(new Error('invalid reply'))
  if (!isString(shard)) {
    errors.push(new Error('body must contain a string'))
  } else {
    if (!isBoxedMessage(shard) || shareVersion === '1.0.0') {
      if (!validateShard(shard, shareVersion)) errors.push(new Error('invalid shard'))
    }
  }

  if (!errors.length) return true

  isReply.errors = errors
  return false
}

// temporary - TODO use ssb-ref
function isBoxedMessage (message) {
  return /\.box$/.test(message)
}
