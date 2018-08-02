const pull = require('pull-stream')
const next = require('pull-next-query')
const { isInvite } = require('ssb-invite-schema')

module.exports = function (server) {
  return function requests (rootId, opts = {}) {
    const _opts = Object.assign({}, {
      limit: 100,
      query: [{
        $filter: {
          value: {
            timestamp: { $gt: 0 },
            author: server.id,
            content: {
              type: 'invite',
              root: rootId
            }
          }
        }
      }]
    }, opts)

    return pull(
      next(server.query.read, _opts),
      pull.filter(isInvite)
    )
  }
}
