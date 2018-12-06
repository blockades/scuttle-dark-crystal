const ref = require('ssb-ref')
const fetch = require('./fetch')
const mend = require('./mend')

// const pullRitual = require('../../ritual/pull/mine')

module.exports = function (server) {
  return function recombine (root, cb) {
    if (!ref.isMsgId(root)) return cb(new Error('Invalid root'))

    fetch(server)(root, (err, data) => {
      if (err) return cb(err)

      mend(data, cb)
    })
  }
}
