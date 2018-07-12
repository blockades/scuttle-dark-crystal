const { isRoot } = require('ssb-schema-definitions')

module.exports = function (server) {
  return function get (key, callback) {
    server.get(key, (err, value) => {
      if (err) return callback(err)
      const content = value.content
      if (!isRoot(content)) return callback(new Error(content.errors.join(', ')))
      return callback(null, { key, value })
    })
  }
}
