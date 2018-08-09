const isReply = require('scuttle-invite/isReply')
const getContent = require('ssb-msg-content')

// TODO write an actual schema for replies in the dc context
module.exports = function (msg) {
  return isReply(msg) && getContent(msg).body
}
