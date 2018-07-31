const pull = require('pull-stream')
const next = require('pull-next-query')
const { isShard } = require('ssb-dark-crystal-schema')
const { isMsgId } = require('ssb-ref')

module.exports = function (server) {
  return function byRoot (rootId, opts) {
    if (!rootId) throw new Error('must have a rootId')
    if (!isMsgId(rootId)) throw new Error('Invalid rootId')

    const query = [{
      $filter: {
        value: {
          content: {
            type: 'dark-crystal/shard',
            root: rootId
          }
        }
      }
    }]

    const _opts = Object.assign({}, { query }, opts, { limit: 100 })

    return pull(
      next(server.query.read, _opts),
      pull.filter(isShard)
    )
  }
}

