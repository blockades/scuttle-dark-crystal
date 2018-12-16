const { describe } = require('tape-plus')

const Server = require('../../../../testbot')
const Fetch = require('../../../../../recover/async/fetch')
const Mend = require('../../../../../recover/async/mend')
const buildData = require('../../fetch/data-request.v2.js')

// mix: the intention was for this test to not touch a server, because this method doesn't need to
// in practice I found I was generating the test data from the fetch tests and saving it into a file
// I'm using a server to avoid committing a big file ):

describe('recover.async.mend (v2)', context => {
  let server
  context.beforeEach(function () { server = Server() })
  context.afterEach(function () { server.close() })

  context('works!', (assert, next) => {
    getFetchData(server, (err, data) => {
      if (err) throw err

      Mend(data, (err, secret) => {
        assert.equal(err, null, 'no error')
        assert.equal(secret.secret, 'under the cabbage tree', 'secret is revealed')
        assert.equal(secret.label, 'location of the treasure', 'label is revealed')

        next()
      })
    })
  })
})

function getFetchData (server, cb) {
  buildData(server)((err, data) => {
    if (err) return cb(err)

    Fetch(server)(data.published.root.key, (err, data) => {
      if (err) cb(err)
      else cb(null, data)
    })
  })
}
