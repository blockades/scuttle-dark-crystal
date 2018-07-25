
const { isShard } = require('ssb-dark-crystal-schema')

module.exports = function (server) {
  return function get (key, callback) {
    server.get(key, (err, value) => {
      if (err) return callback(err)
      const content = value.content
      if (isShard(content)) callback(null, { key, value })
      else callback(new Error(content.errors.join(', ')))
    })
  }
}
