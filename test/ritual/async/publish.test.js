const fs = require('fs')
const { describe } = require('tape-plus')
const Server = require('scuttle-testbot')

const Publish = require('../../../ritual/async/publish')

describe('ritual.async.publish', context => {
  let server
  let params
  let publish

  context.beforeEach(c => {
    server = Server()
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
      assert.deepEqual(params, ritual.value.content, 'ritual matches params')
      next()
    })
  })

  context('fails to publish when invalid', (assert, next) => {
    params.type = "dark-schmystal/ritual"
    publish(params, (errs, ritual) => {
      assert.ok(errs, 'has errors')
      assert.notOk(ritual, 'ritual is null')
      next()
    })
  })
})
