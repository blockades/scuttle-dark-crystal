const fs = require('fs')
const { describe } = require('tape-plus')
const Server = require('scuttle-testbot')

const Publish = require('../../../shard/async/publish')

describe('shard.async.publish', context => {
  let server
  let params
  let publish

  context.beforeEach(c => {
    server = Server()
    publish = Publish(server)
    params = JSON.parse(fs.readFileSync('./test/fixtures/shard.json', 'utf8'))
  })

  context.afterEach(c => {
    server.close()
  })

  context('publishes a message when valid', (assert, next) => {
    publish(params, (err, shard) => {
      assert.notOk(err, 'null errors')
      assert.ok(shard, 'valid shard object')
      assert.deepEqual(params, shard.value.content, 'shard matches params')
      next()
    })
  })

  context('fails to publish when invalid', (assert, next) => {
    params.type = "dark-schmystal/shard"
    publish(params, (errs, shard) => {
      assert.ok(errs, 'has errors')
      assert.notOk(shard, 'shard is null')
      next()
    })
  })
})
