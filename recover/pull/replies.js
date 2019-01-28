const pull = require('pull-stream')
const next = require('pull-next-query')
const isReply = require('../../isReply')

module.exports = function (server) {
  return function replies (rootId, opts = {}) {
    const query = [{
      $filter: {
        value: {
          timestamp: { $gt: 0 },
          content: rootId
            ? { type: 'invite-reply', root: rootId }
            : { type: 'invite-reply' }
        }
      }
    }]

    const _opts = Object.assign({ limit: 100 }, opts, { query })
    return pull(
      next(server.query.read, _opts),
      pull.filter(isReply)
    )
  }
}
