const pull = require('pull-stream')
const next = require('pull-next-query')
const { isRoot } = require('ssb-dark-crystal-schema')

// module.exports = function (server) {
//   return function get (rootId, opts = {}) {
//     const query = [{
//       $filter: {
//         key: rootId,
//         value: {
//           timestamp: { $gt: 0 } // needed for how I set up /query page
//         }
//       }
//     }]
//
//     const _opts = Object.assign({}, { query }, opts)
//     // NOTE - this could benefit from a deeper merge?
//
//     return pull(
//       next(server.query.read, _opts)
//     )
//   }
// }

module.exports = function (server) {
  return function get (rootId, cb) {
    return server.get(rootId, cb)
  }
}
