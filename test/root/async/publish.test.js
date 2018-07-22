const fs = require('fs')
const { describe } = require('tape-plus')
const Server = require('../../testbot')

const Publish = require('../../../root/async/publish')

describe('root.async.publish', context => {
  let server
  let params
  let publish

  context.beforeEach(c => {
    server = Server()

    publish = Publish(server)
    params = JSON.parse(fs.readFileSync('./test/fixtures/root.json', 'utf8'))
  })

  context.afterEach(c => {
    server.close()
  })

  context('publishes a message when valid', (assert, next) => {
    publish(params, (err, root) => {
      assert.notOk(err, 'null errors')
      assert.ok(root, 'valid root object')
      for (var k in params) {
        assert.equal(params[k], root.value.content[k], `params key ${k} in root`)
      }
      next()
    })
  })

  context('fails to publish when invalid', (assert, next) => {
    params.type = "dark-schmystal/root"
    publish(params, (errs, root) => {
      assert.ok(errs, 'has errors')
      assert.notOk(root, 'root is null')
      next()
    })
  })
})
