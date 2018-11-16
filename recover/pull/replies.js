const pull = require('pull-stream')
const next = require('pull-next-query')
const isReply = require('scuttle-invite/isReply')

module.exports = function (server) {
  return function replies (rootId, opts = {}) {
    const _opts = Object.assign({}, {
      limit: 100,
      query: [{
        $filter: {
          value: {
            timestamp: { $gt: 0 },
            content: {
              type: 'invite-reply',
              root: rootId
            }
          }
        }
      }]
    }, opts)

    return pull(
      next(server.query.read, _opts),
      pull.filter(r => isReply(r, version))
    )
  }
}
