const pull = require('pull-stream')
const next = require('pull-next-query')
const { isForwardRequest } = require('ssb-dark-crystal-schema')
const { isFeedId } = require('ssb-ref')

module.exports = function (server) {
  return function byAuthor (author, opts = {}) {
    assert(isFeedId(author), 'author must be a valid feedId')
    const query = [{
      $filter: {
        value: {
          timestamp: { $gt: 0 }, // needed for pull-next-query to stepOn on published timestamp
          content: { type: 'dark-crystal/forward-request' }
        }
      }
    }, {
      $filter: {
        value: {
          author
        }
      }
    }]

    const _opts = Object.assign({}, { query, limit: 100 }, opts)

    return pull(
      next(server.query.read, _opts),
      pull.filter(isForwardRequest)
    )
  }
}

function assert (test, message) {
  if (!test) throw new Error(message || 'AssertionError')
}
