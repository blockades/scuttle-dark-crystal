const _isReply = require('scuttle-invite/isReply')
const getContent = require('ssb-msg-content')
const { validateShard } = require('./lib/secrets-wrapper')
const isString = require('./lib/isString')

// TODO: this should live elsewhere
const versions = ['1.0.0', '2.0.0']

module.exports = function isReply (msg) {
  const msgContent = getContent(msg)
  const shard = msgContent.body
  let shareVersion = msgContent.shareVersion || '1.0.0'
  const errors = []

  if (!_isReply(msg)) errors.push(new Error('invalid reply'))
  if (!isString(shareVersion)) errors.push(new Error('shareVersion must be a string'))
  if (versions.indexOf(shareVersion) < 0) errors.push(new Error('Unknown shareVersion'))
  if (!validateShard(shard, shareVersion)) errors.push(new Error('invalid shard'))

  if (!errors.length) return true

  isReply.errors = errors
  return false
}
