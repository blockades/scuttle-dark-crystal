const pull = require('pull-stream')
const isReply = require('scuttle-invite/isReply')

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

    return pull(
      server.query.read(Object.assign({}, opts, { query })),
      pull.filter(isReply)
    )
  }
}
