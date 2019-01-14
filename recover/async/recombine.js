const { isMsg } = require('ssb-ref')
const fetch = require('./fetch')
const mend = require('./mend')

module.exports = function (server) {
  return function recombine (root, cb) {
    if (!isMsg(root)) return cb(new Error('Invalid root'))

    fetch(server)(root, (err, data) => {
      if (err) return cb(err)
      mend(server)(data, cb)
    })
  }
}
