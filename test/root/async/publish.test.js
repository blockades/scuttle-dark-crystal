const fs = require('fs')
const { describe } = require('tape-plus')
const Server = require('../../testbot')

const Publish = require('../../../root/async/publish')

describe('root.async.publish', context => {
  let server
  let name
  let publish

  context.beforeEach(c => {
    server = Server()

    publish = Publish(server)
    name = "my first dark crystal"
  })

  context.afterEach(c => {
    server.close()
  })

  context('publishes a message when valid', (assert, next) => {
    publish(name, (err, root) => {
      assert.notOk(err, 'null errors')
      assert.ok(root, 'valid root object')
      assert.equal(name, root.value.content.name, 'name is inserted')
      next()
    })
  })

  context('fails to publish when invalid', (assert, next) => {
    name = 12323232
    publish(name, (errs, root) => {
      assert.ok(errs, 'has errors')
      assert.notOk(root, 'root is null')
      next()
    })
  })
})
