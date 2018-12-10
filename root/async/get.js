const pull = require('pull-stream')
const { isMsg } = require('ssb-ref')
const isRoot = require('../../isRoot')

module.exports = function getRoot (server) {
  return function (rootId, cb) {
    if (!isMsg(rootId)) return cb(new Error(`getRoot expects a Message key, got ${JSON.stringify(rootId)}`))

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
        if (!root) return cb(new Error('no known dark-crystal with that rootId'))
        if (!isRoot(root)) return cb(isRoot.errors)

        cb(null, root)
      })
    )
  }
}
