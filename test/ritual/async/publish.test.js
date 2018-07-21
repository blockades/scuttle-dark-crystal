const fs = require('fs')
const { describe } = require('tape-plus')

const Publish = require('../../../ritual/async/publish')

describe('ritual.async.publish', context => {
  let server
  let params
  let publish

  context.beforeEach(c => {
    server = require('scuttle-testbot')
      .use(require('ssb-private'))
      .call()
    publish = Publish(server)
    params = JSON.parse(fs.readFileSync('./test/fixtures/ritual.json', 'utf8'))
  })

  context.afterEach(c => {
    server.close()
  })

  context('publishes a message when valid', (assert, next) => {
    publish(params, (err, ritual) => {
      assert.notOk(err, 'null errors')
      assert.ok(ritual, 'valid ritual object')
      for (var k in params) {
        assert.equal(params[k], ritual.value.content[k], `params key ${k} in ritual`)
      }
      next()
    })
  })

  context('fails to publish when invalid', (assert, next) => {
    params.quorum = 'dog'
    publish(params, (errs, ritual) => {
      assert.ok(errs, 'has errors')
      assert.notOk(ritual, 'ritual is null')
      next()
    })
  })
})
