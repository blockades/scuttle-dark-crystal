const pull = require('pull-stream')
const next = require('pull-next-query')
const { isRitual } = require('ssb-dark-crystal-schema')
const { isMsgId } = require('ssb-ref')

module.exports = function (server) {
  return function byRoot (rootId, opts = {}) {
    if (!rootId) throw new Error('must have a rootId')
    if (!isMsgId(rootId)) throw new Error('Invalid rootId')

    const query = [{
      $filter: {
        value: {
          timestamp: { $gt: 0 },
          content: {
            type: 'dark-crystal/ritual',
            root: rootId
          }
        }
      }
    }]

    const _opts = Object.assign({}, { query, limit: 100 }, opts)

    return pull(
      next(server.query.read, _opts),
      pull.filter(isRitual)
    )
  }
}
