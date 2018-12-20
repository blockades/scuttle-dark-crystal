const pull = require('pull-stream')

const isRitual = require('../isRitual')
const isShard = require('../isShard')
const isRequest = require('../isRequest')
const isReply = require('../isReply')
const isForward = require('../isForward')


module.exports = function getBacklinks (server) {
  return function (rootId, cb) {
    const query = [{
      $filter: {
        dest: rootId,
        value: {
          content: { root: rootId }
        }
      }
    }]

    pull(
      server.backlinks.read({ query }),
      pull.filter(bySupported),
      pull.collect(cb)
    )
  }
}

function bySupported (msg) {
  return isRitual(msg) ||
    isShard(msg) ||
    isRequest(msg) ||
    isReply(msg) ||
    isForward(msg)
}
