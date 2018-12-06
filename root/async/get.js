const pull = require('pull-stream')
const isRoot = require('../../isRoot')

module.exports = function getRoot (server) {
  return function (rootId, cb) {
    // mix: could write this as server.get -> server.private.unbox
    // but this index gives us unboxed for free
    // and our test are publishing publish messages!

    const query = [{
      $filter: {
        key: rootId,
        value: {
          author: server.id,
          content: { type: 'dark-crystal/root' }
        }
      }
    }]

    pull(
      server.query.read({ query }),
      pull.collect((err, roots) => {
        if (err) return cb(err)
        const root = roots[0]
        if (!isRoot(root)) return cb(isRoot.errors)

        cb(null, root)
      })
    )
  }
}
