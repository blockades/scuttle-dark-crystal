const pull = require('pull-stream')
const { isForward } = require('ssb-dark-crystal-schema')
const { isMsgId } = require('ssb-ref')

module.exports = function (server) {
  return function fromOthersByRoot (rootId, opts = {}) {
    if (!rootId) throw new Error('must have a rootId')
    if (!isMsgId(rootId)) throw new Error('Invalid rootId')

    const query = [{
      $filter: {
        value: {
          timestamp: { $gt: 0 }, // needed for pull-next-query to stepOn on published timestamp
          content: {
            type: 'dark-crystal/forward',
            root: rootId
          }
        }
      }
    }, {
      $filter: {
        value: {
          author: { $ne: server.id }
        }
      }
    }]

    const _opts = Object.assign({}, { query }, opts)

    return pull(
      server.query.read(_opts),
      pull.filter(isForward)
    )
  }
}
